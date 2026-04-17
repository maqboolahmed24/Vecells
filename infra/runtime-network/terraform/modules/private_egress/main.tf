
locals {
  allowlist_map = {
    for row in var.allowlists :
    row.egress_allowlist_ref => merge(row, {
      overlay = one([
        for overlay in var.environment_overlays : overlay
        if overlay.egress_allowlist_ref == row.egress_allowlist_ref
      ])
    })
  }
}
