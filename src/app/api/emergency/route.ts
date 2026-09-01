import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type EmergencyMode = "demo" | "live";

interface EmergencyIncident {
  incidentId: string;
  mode: EmergencyMode;
  ambulanceEtaMinutes: number;
  fireBrigadeEtaMinutes: number;
  createdAt: string;
  lastUpdatedAt: string;
}

declare global {
  // Development and single-instance deployments retain the active incident here.
  // A multi-instance production deployment should replace this with a shared store.
  // eslint-disable-next-line no-var
  var sifEmergencyIncident: EmergencyIncident | undefined;
}

function getMode(): EmergencyMode {
  return process.env.EMERGENCY_RESPONSE_MODE?.toLowerCase() === "live" ? "live" : "demo";
}

function getStatus(incident: EmergencyIncident) {
  return {
    incidentId: incident.incidentId,
    mode: incident.mode,
    ambulanceEtaMinutes: incident.ambulanceEtaMinutes,
    fireBrigadeEtaMinutes: incident.fireBrigadeEtaMinutes,
    createdAt: incident.createdAt,
    lastUpdatedAt: incident.lastUpdatedAt,
  };
}

async function notifyLiveDispatchers(incidentId: string, raisedAt: string) {
  const sharedDispatcher = process.env.EMERGENCY_DISPATCH_WEBHOOK_URL;
  const ambulanceDispatcher = process.env.AMBULANCE_DISPATCH_WEBHOOK_URL || sharedDispatcher;
  const fireDispatcher = process.env.FIRE_BRIGADE_DISPATCH_WEBHOOK_URL || sharedDispatcher;

  if (!ambulanceDispatcher || !fireDispatcher) {
    throw new Error("Live dispatch is not configured for both ambulance and fire brigade.");
  }

  const payload = JSON.stringify({
    event: "critical_emergency_response_requested",
    incident_id: incidentId,
    raised_at: raisedAt,
    source: "SIF Sentinel",
    services_requested: ["ambulance", "fire_brigade"],
  });

  const dispatchers = [...new Set([ambulanceDispatcher, fireDispatcher])];
  const results = await Promise.all(
    dispatchers.map(async (url) => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      if (!response.ok) {
        throw new Error("Emergency dispatcher did not acknowledge the request.");
      }
    })
  );

  return results;
}

export async function GET() {
  if (!globalThis.sifEmergencyIncident) {
    return NextResponse.json({ success: false, error: "No active emergency response." }, { status: 404 });
  }

  return NextResponse.json({ success: true, status: getStatus(globalThis.sifEmergencyIncident) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "refresh") {
      const incident = globalThis.sifEmergencyIncident;
      if (!incident || body.incidentId !== incident.incidentId) {
        return NextResponse.json({ success: false, error: "Emergency response was not found." }, { status: 404 });
      }

      incident.ambulanceEtaMinutes = Math.max(0, incident.ambulanceEtaMinutes - 1);
      incident.fireBrigadeEtaMinutes = Math.max(0, incident.fireBrigadeEtaMinutes - 1);
      incident.lastUpdatedAt = new Date().toISOString();
      return NextResponse.json({ success: true, status: getStatus(incident) });
    }

    if (body.action === "end") {
      const incident = globalThis.sifEmergencyIncident;
      if (!incident || body.incidentId !== incident.incidentId) {
        return NextResponse.json({ success: false, error: "Emergency response was not found." }, { status: 404 });
      }
      if (incident.mode === "live") {
        return NextResponse.json(
          { success: false, error: "A live emergency can only be closed through the site incident procedure." },
          { status: 403 }
        );
      }

      globalThis.sifEmergencyIncident = undefined;
      return NextResponse.json({ success: true });
    }

    if (body.action !== "trigger") {
      return NextResponse.json({ success: false, error: "Unsupported emergency action." }, { status: 400 });
    }

    const mode = getMode();
    const raisedAt = new Date().toISOString();
    const incidentId = `emg-${crypto.randomUUID()}`;

    if (mode === "live") {
      try {
        await notifyLiveDispatchers(incidentId, raisedAt);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to contact emergency dispatchers.";
        return NextResponse.json({ success: false, error: message }, { status: 502 });
      }
    }

    globalThis.sifEmergencyIncident = {
      incidentId,
      mode,
      ambulanceEtaMinutes: 8,
      fireBrigadeEtaMinutes: 11,
      createdAt: raisedAt,
      lastUpdatedAt: raisedAt,
    };

    return NextResponse.json({ success: true, status: getStatus(globalThis.sifEmergencyIncident) }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Emergency request could not be processed." }, { status: 500 });
  }
}
