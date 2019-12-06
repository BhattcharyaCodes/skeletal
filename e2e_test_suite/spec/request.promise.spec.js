var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let rp = require('request-promise');
let fs = require('fs');
function apiResponsesswapi(uri, method) {
    return __awaiter(this, void 0, void 0, function* () {
        var options = {
            method: method,
            uri: uri,
            headers: {
                "Content-Type": "application/json",
            },
            json: true,
        };
        return rp(options);
    });
}
;
describe('Swapi', () => {
    it('should get info for death star', () => __awaiter(this, void 0, void 0, function* () {
        let getBody = yield apiResponsesswapi('https://swapi.co/api/starships/9/', 'GET');
        console.log(getBody);
        let jsonGetBody = JSON.stringify(getBody, null, 3);
        fs.writeFileSync('./Reports/api_responses/swapi_response.json', jsonGetBody);
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC5wcm9taXNlLnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXF1ZXN0LnByb21pc2Uuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUNwQyxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFdkIsU0FBZSxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsTUFBTTs7UUFDeEMsSUFBSSxPQUFPLEdBQUc7WUFDVixNQUFNLEVBQUUsTUFBTTtZQUNkLEdBQUcsRUFBRSxHQUFHO1lBQ1IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxrQkFBa0I7YUFDaEM7WUFDTixJQUFJLEVBQUUsSUFBSTtTQUNiLENBQUE7UUFDRCxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUN0QixDQUFDO0NBQUE7QUFBQSxDQUFDO0FBRUYsUUFBUSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7SUFDbkIsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLEdBQU8sRUFBRTtRQUMxQyxJQUFJLE9BQU8sR0FBRyxNQUFNLGlCQUFpQixDQUFDLG1DQUFtQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xGLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckIsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25ELEVBQUUsQ0FBQyxhQUFhLENBQUMsNkNBQTZDLEVBQUMsV0FBVyxDQUFDLENBQUE7SUFDL0UsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIn0=