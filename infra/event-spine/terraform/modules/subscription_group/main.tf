locals {
  binding_ref = "${var.stream_ref}:${var.queue_ref}:${var.consumer_group_ref}"
}
