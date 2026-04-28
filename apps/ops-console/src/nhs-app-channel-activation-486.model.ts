export const NHS_APP_CHANNEL_ACTIVATION_486_TASK_ID = "seq_486";
export const NHS_APP_CHANNEL_ACTIVATION_486_VISUAL_MODE = "NHSApp_Channel_Activation_486";
export const NHS_APP_CHANNEL_ACTIVATION_486_PATH = "/ops/release/nhs-app/channel-activation";

export interface NHSAppActivation486RouteRow {
  readonly routeFamily: string;
  readonly journeyPaths: readonly string[];
  readonly coverageState: "exact" | "fallback" | "blocked";
  readonly safeReturn: "exact" | "blocked";
  readonly artifactPosture: "not_required" | "summary_first" | "blocked";
  readonly freezeDisposition: "monitoring" | "placeholder_only" | "hidden";
}

export interface NHSAppActivation486Projection {
  readonly taskId: typeof NHS_APP_CHANNEL_ACTIVATION_486_TASK_ID;
  readonly visualMode: typeof NHS_APP_CHANNEL_ACTIVATION_486_VISUAL_MODE;
  readonly manifestVersionRef: string;
  readonly activationPlanRef: string;
  readonly commandRef: string;
  readonly settlementRef: string;
  readonly settlementResult: "applied";
  readonly channelExposureState: "enabled";
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly environmentLadder: readonly {
    readonly label: string;
    readonly state: "exact" | "approved" | "current";
    readonly evidenceRef: string;
  }[];
  readonly routeRows: readonly NHSAppActivation486RouteRow[];
  readonly monthlyObligations: readonly {
    readonly label: string;
    readonly state: "bound" | "current";
    readonly evidenceRef: string;
  }[];
  readonly freezeDisposition: {
    readonly state: "monitoring";
    readonly mode: "none";
    readonly safeRouteRef: string;
  };
}

export function isNHSAppActivation486Path(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === NHS_APP_CHANNEL_ACTIVATION_486_PATH;
}

export function createNHSAppActivation486Projection(): NHSAppActivation486Projection {
  return {
    taskId: NHS_APP_CHANNEL_ACTIVATION_486_TASK_ID,
    visualMode: NHS_APP_CHANNEL_ACTIVATION_486_VISUAL_MODE,
    manifestVersionRef: "nhsapp-manifest-v0.1.0-freeze-374",
    activationPlanRef: "manifest_activation_plan_486_approved_embedded",
    commandRef: "nhs_app_channel_command_486_approved_embedded",
    settlementRef: "nhs_app_channel_settlement_486_approved_embedded",
    settlementResult: "applied",
    channelExposureState: "enabled",
    releaseCandidateRef: "RC_LOCAL_V1",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    releaseWatchTupleRef: "RWT_LOCAL_V1",
    watchTupleHash: "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
    environmentLadder: [
      {
        label: "Sandpit",
        state: "exact",
        evidenceRef: "data/config/396_nhs_app_environment_profile_manifest.example.json",
      },
      {
        label: "AOS",
        state: "approved",
        evidenceRef: "data/conformance/473_phase7_channel_readiness_reconciliation.json",
      },
      {
        label: "Live profile",
        state: "current",
        evidenceRef: "data/channel/486_nhs_app_manifest_activation_plan.json",
      },
    ],
    routeRows: [
      {
        routeFamily: "Start request",
        journeyPaths: ["jp_start_medical_request", "jp_continue_draft"],
        coverageState: "exact",
        safeReturn: "exact",
        artifactPosture: "not_required",
        freezeDisposition: "monitoring",
      },
      {
        routeFamily: "Request status",
        journeyPaths: ["jp_request_status", "jp_respond_more_info"],
        coverageState: "exact",
        safeReturn: "exact",
        artifactPosture: "not_required",
        freezeDisposition: "monitoring",
      },
      {
        routeFamily: "Booking",
        journeyPaths: ["jp_manage_local_appointment"],
        coverageState: "exact",
        safeReturn: "exact",
        artifactPosture: "summary_first",
        freezeDisposition: "monitoring",
      },
      {
        routeFamily: "Pharmacy",
        journeyPaths: ["jp_pharmacy_choice", "jp_pharmacy_status"],
        coverageState: "exact",
        safeReturn: "exact",
        artifactPosture: "summary_first",
        freezeDisposition: "monitoring",
      },
      {
        routeFamily: "Secure link recovery",
        journeyPaths: ["jp_continue_draft", "jp_request_status"],
        coverageState: "exact",
        safeReturn: "exact",
        artifactPosture: "not_required",
        freezeDisposition: "monitoring",
      },
      {
        routeFamily: "Letter summary",
        journeyPaths: ["jp_manage_local_appointment", "jp_pharmacy_status"],
        coverageState: "fallback",
        safeReturn: "exact",
        artifactPosture: "summary_first",
        freezeDisposition: "monitoring",
      },
    ],
    monthlyObligations: [
      {
        label: "Monthly journey data pack",
        state: "bound",
        evidenceRef: "wop_476_nhs_app_monthly_pack",
      },
      {
        label: "SCAL and assurance evidence",
        state: "current",
        evidenceRef: "data/signoff/477_final_signoff_register.json",
      },
      {
        label: "Journey-change control",
        state: "bound",
        evidenceRef: "journey-change-notice-486-approved_embedded",
      },
    ],
    freezeDisposition: {
      state: "monitoring",
      mode: "none",
      safeRouteRef: "/nhs-app/embedded?state=deferred&flow=status",
    },
  };
}
