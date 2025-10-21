import { joinRelativeURL } from "ufo";
export function getAdminPath(path) {
    return joinRelativeURL("/app/admin", path);
}
