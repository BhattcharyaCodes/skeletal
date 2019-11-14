"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
//import {'element', 'Elements', $, $$, Keys} from 'protractor'
//import * from 'protractor';
//export * from "protractor" ;
describe('homepage', function () {
    beforeAll(function () {
        protractor_1.browser.waitForAngularEnabled(false);
        let url = 'https://www.google.com/';
        protractor_1.browser.get(url);
    });
    it('should open the google search page', function () {
        // browser.get('https://www.google.com/');
        let search_text = 'gibberish';
        //element(by.className('gLFyf gsfi')).sendKeys(search_text);
        //expect.(search_text)toEqual('gibberish');
        //https://www.google.com/
        //browser.actions().sendKeys(protractor.Keys.ENTER).perform();
        //expect(greeting.getText()).toEqual('Hello Puja!');
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUNiLDJDQUFpRjtBQUVqRiwrREFBK0Q7QUFDL0QsNkJBQTZCO0FBQzdCLDhCQUE4QjtBQUM5QixRQUFRLENBQUMsVUFBVSxFQUFFO0lBRWpCLFNBQVMsQ0FBQztRQUNWLG9CQUFPLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckMsSUFBSSxHQUFHLEdBQUcseUJBQXlCLENBQUM7UUFDcEMsb0JBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDakIsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUU7UUFFMUMsMENBQTBDO1FBQ3pDLElBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUM5Qiw0REFBNEQ7UUFDNUQsMkNBQTJDO1FBQzNDLHlCQUF5QjtRQUN6Qiw4REFBOEQ7UUFDOUQsb0RBQW9EO0lBQ3BELENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUMifQ==