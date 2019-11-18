"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
//commenting out the expect package
//import expect;
//var expect = require('expect'); // v1.15.1
describe('homepage', () => {
    let search_text = 'gibberish';
    let url = 'https://www.google.com/';
    // let EC = protractor.ExpectedConditions;
    // let browser_url: any;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        protractor_1.browser.waitForAngularEnabled(false);
        debugger;
        yield protractor_1.browser.get(url);
        //        await browser.get(url);
    }));
    it('should open the google search engine', () => __awaiter(void 0, void 0, void 0, function* () {
        // let wait_urlIs =  await browser.wait(EC.urlIs(url), 10000);
        // console.log(wait_urlIs);
        // expect(url).toBe(wait_urlIs); 
        expect(true).toBeTruthy();
        // debugger;
        expect(protractor_1.browser.getCurrentUrl()).toEqual('https://www.google.com/');
        // expect(browser.wait(EC.urlIs(url), 10000)).toBeTruthy();
    }));
    it('should load the google image', () => __awaiter(void 0, void 0, void 0, function* () {
        let google_img = protractor_1.element(protractor_1.by.id('hplogo'));
        expect(google_img.isPresent()).toBeTruthy();
    }));
    // it('should search for the input text',async() => {
    //     var search_box_locator = "input.['gLFyf gsfi']";
    //     let search_box = await $(search_box_locator);
    //     search_box.sendKeys(search_text, protractor.Key.ENTER, protractor.Key.NULL);
    //     let res = await browser.wait(EC.textToBePresentInElement(search_box, search_text), 8000);
    //     expect(res).toBeTruthy();
    // });
    // xit('should be able to navigate to the first search result', async() => {
    // });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkY7QUFDN0YsbUNBQW1DO0FBQ25DLGdCQUFnQjtBQUNoQiw0Q0FBNEM7QUFFNUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7SUFFdEIsSUFBSSxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBQzlCLElBQUksR0FBRyxHQUFHLHlCQUF5QixDQUFDO0lBQ3BDLDBDQUEwQztJQUMxQyx3QkFBd0I7SUFDeEIsU0FBUyxDQUFDLEdBQVEsRUFBRTtRQUNoQixvQkFBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLFFBQVEsQ0FBQztRQUNULE1BQU0sb0JBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsaUNBQWlDO0lBQzdCLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsc0NBQXNDLEVBQUUsR0FBUSxFQUFFO1FBQ2pELDhEQUE4RDtRQUM5RCwyQkFBMkI7UUFDNUIsaUNBQWlDO1FBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixZQUFZO1FBQ1osTUFBTSxDQUFDLG9CQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUVwRSwyREFBMkQ7SUFDOUQsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw4QkFBOEIsRUFBRSxHQUFRLEVBQUU7UUFDekMsSUFBSSxVQUFVLEdBQUcsb0JBQU8sQ0FBQyxlQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDMUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ2hELENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxxREFBcUQ7SUFDckQsdURBQXVEO0lBQ3ZELG9EQUFvRDtJQUNwRCxtRkFBbUY7SUFDbkYsZ0dBQWdHO0lBQ2hHLGdDQUFnQztJQUNoQyxNQUFNO0lBRU4sNEVBQTRFO0lBRTVFLE1BQU07QUFFVixDQUFDLENBQUMsQ0FBQyJ9