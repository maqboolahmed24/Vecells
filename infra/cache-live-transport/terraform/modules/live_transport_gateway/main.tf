locals {
  transport_gateway_ref = "live-transport:${length(var.transport_channel_refs)}"
}
