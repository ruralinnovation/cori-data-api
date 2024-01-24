"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
// import { writeFileSync, existsSync, mkdirSync } from 'fs';
const node_fs_1 = require("node:fs");
const graphql_1 = require("graphql");
const merge_schemas_1 = require("./merge-schemas");
Object.defineProperty(exports, "schema", { enumerable: true, get: function () { return merge_schemas_1.schemas; } });
try {
    if (!(0, node_fs_1.existsSync)('dist')) {
        (0, node_fs_1.mkdirSync)('dist');
    }
    (0, node_fs_1.writeFileSync)('dist/schema.graphql', (0, graphql_1.printSchema)(merge_schemas_1.schemas));
}
catch (e) { }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2REFBNkQ7QUFDN0QscUNBQStEO0FBQy9ELHFDQUFzQztBQUN0QyxtREFBMEM7QUFVN0IsdUZBVkosdUJBQU8sT0FVRztBQVJuQixJQUFJLENBQUM7SUFDSCxJQUFJLENBQUMsSUFBQSxvQkFBVSxFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDeEIsSUFBQSxtQkFBUyxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFDRCxJQUFBLHVCQUFhLEVBQUMscUJBQXFCLEVBQUUsSUFBQSxxQkFBVyxFQUFDLHVCQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCB7IHdyaXRlRmlsZVN5bmMsIGV4aXN0c1N5bmMsIG1rZGlyU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IHdyaXRlRmlsZVN5bmMsIGV4aXN0c1N5bmMsIG1rZGlyU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHsgcHJpbnRTY2hlbWEgfSBmcm9tICdncmFwaHFsJztcbmltcG9ydCB7IHNjaGVtYXMgfSBmcm9tICcuL21lcmdlLXNjaGVtYXMnO1xuXG50cnkge1xuICBpZiAoIWV4aXN0c1N5bmMoJ2Rpc3QnKSkge1xuICAgIG1rZGlyU3luYygnZGlzdCcpO1xuICB9XG4gIHdyaXRlRmlsZVN5bmMoJ2Rpc3Qvc2NoZW1hLmdyYXBocWwnLCBwcmludFNjaGVtYShzY2hlbWFzKSk7XG59IGNhdGNoIChlKSB7fVxuXG5leHBvcnQge1xuICBzY2hlbWFzIGFzIHNjaGVtYVxufTtcbiJdfQ==