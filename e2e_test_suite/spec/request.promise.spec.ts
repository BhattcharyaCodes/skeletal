let rp = require('request-promise');
let fs = require('fs');

async function apiResponsesswapi(uri, method ){
    var options = {
        method: method,
        uri: uri,
        headers: {
            "Content-Type": "application/json",
             },
        json: true,
    }
    return rp(options)
};

describe('Swapi', () =>{
    it('should get info for death star', async()=>{
        let getBody = await apiResponsesswapi('https://swapi.co/api/starships/9/', 'GET');
        console.log(getBody);
        let jsonGetBody = JSON.stringify(getBody, null, 3);
        fs.writeFileSync('./Reports/api_responses/swapi_response.json',jsonGetBody)
    });

    it('should detect the change in the value of the webelement depending upon the api response', async() => {

    });
});