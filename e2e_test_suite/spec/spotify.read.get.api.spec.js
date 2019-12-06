// // import { HttpClient } from "protractor-http-client";
// const HttpClient = require("protractor-http-client").HttpClient;
// let fs = require('fs');
// // import { writeFileSync, writeFile } from "fs";
// describe('Star wars api testing', () => {
//     it('should be able to  find characters in the star wars realm', async () => {
//         console.log("=============it===============");
//         const http = new HttpClient("https://www.springboard.com/");
//         let response = await http.get("/get-country/", "Content-Type: application/json");
//         // let jsonResponse = await response.jsonBody;
//         // console.log(response.jsonBody);
//         let getApiResponses = await response.body;
//         let jsondata = JSON.stringify(getApiResponses, null, 3);
//         await fs.writeFileSync('./Reports/api_responses/swapi_deathstart_info.json',jsondata);
//         // let stringBody:Promise<string> = response.stringBody;
//         console.log(response.statusCode);
//         expect(response.statusCode).toEqual(200);
//         console.log("=============it response starts===============");
//         console.log(response);
//         console.log("=============it over===============");
//     });
// });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BvdGlmeS5yZWFkLmdldC5hcGkuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNwb3RpZnkucmVhZC5nZXQuYXBpLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMERBQTBEO0FBQzFELG1FQUFtRTtBQUNuRSwwQkFBMEI7QUFDMUIsb0RBQW9EO0FBR3BELDRDQUE0QztBQUM1QyxvRkFBb0Y7QUFDcEYseURBQXlEO0FBQ3pELHVFQUF1RTtBQUN2RSw0RkFBNEY7QUFDNUYseURBQXlEO0FBQ3pELDZDQUE2QztBQUM3QyxxREFBcUQ7QUFDckQsbUVBQW1FO0FBQ25FLGlHQUFpRztBQUNqRyxtRUFBbUU7QUFDbkUsNENBQTRDO0FBQzVDLG9EQUFvRDtBQUNwRCx5RUFBeUU7QUFFekUsaUNBQWlDO0FBQ2pDLDhEQUE4RDtBQUc5RCxVQUFVO0FBSVYsTUFBTSJ9