# 81 Reservation Truth and Queue Fairness Rules

## Reservation truth

`soft_selected` is not exclusivity. A patient may see non-exclusive copy, but never a hold countdown or calm exclusivity language unless a real `held` reservation with a persisted expiry exists.

`pending_confirmation` is not final success. It preserves uncertainty and routes later confirmation work through the existing reservation-confirmation substrate instead of inventing calm success locally.

## Queue fairness

One committed `QueueRankSnapshot` fixes the canonical queue order. Fairness merge posture and overload suppression are persisted as first-class control facts so replay produces the same order and the same operator-facing explanation.

Assignment advice is downstream only. Suggestion rows must preserve the committed ordinal, tie-break key, and explanation reference published by the source snapshot.

## Next-task discipline

Next-task launch may use only one committed queue snapshot. Mixed snapshot refs are blocked, and stale-owner recovery blocks launch even when the base queue is otherwise valid.
