import { Edge } from "edge.js";
import { join } from "path";

const cwd = Deno.cwd();

const edge = new Edge({ cache: false });
edge.mount(join(cwd, "app/views"));

export default edge;
