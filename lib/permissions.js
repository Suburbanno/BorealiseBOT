export const ROLE_LEVELS = {
    host: 100,
    cohost: 80,
    manager: 60,
    bouncer: 50,
    resident_dj: 20,
    user: 0,
};
export function getRoleLevel(role) {
    return ROLE_LEVELS[(role ?? "").toLowerCase()] ?? 0;
}
