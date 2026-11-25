// k6 v2.4.0 httpext/tracer.go:303–304 includes connection setup in Blocked.
export function requestDuration(timings) {
  return timings.blocked + timings.duration;
}
