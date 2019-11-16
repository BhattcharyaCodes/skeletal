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
var expect = require('expect'); // v1.15.1
describe('homepage', () => {
    let search_text = 'gibberish';
    let url = 'https://www.google.com/';
    let EC = protractor_1.protractor.ExpectedConditions;
    //var browser_url = browser.get(url);
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        protractor_1.browser.waitForAngularEnabled(false);
        yield protractor_1.browser.get(url);
    }));
    it('should open the google search engine', () => __awaiter(void 0, void 0, void 0, function* () {
        let wait_urlIs = yield protractor_1.browser.wait(EC.urlIs(url), 5000);
        expect(protractor_1.browser.get(url)).toBe(wait_urlIs);
    }));
    // it('should search for the input text',async() => {
    //     var search_box_locator = "input[class='gLFyf gsfi']";
    //     let search_box = await $(search_box_locator);
    //     search_box.sendKeys(search_text, protractor.Key.ENTER, protractor.Key.NULL);
    //    // expect(search_text).toEqual(await search_box.getText());
    //     let res = await browser.wait(EC.textToBePresentInElement(search_box, search_text), 8000);
    //     expect(res).toBeTruthy();
    // });
    // xit('should be able to navigate to the first search result', async() => {
    // });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkY7QUFDN0YsbUNBQW1DO0FBQ25DLGdCQUFnQjtBQUNoQixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVO0FBRTFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO0lBQ3RCLElBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQztJQUM5QixJQUFJLEdBQUcsR0FBRyx5QkFBeUIsQ0FBQztJQUNwQyxJQUFJLEVBQUUsR0FBRyx1QkFBVSxDQUFDLGtCQUFrQixDQUFDO0lBQ3ZDLHFDQUFxQztJQUVyQyxTQUFTLENBQUMsR0FBUSxFQUFFO1FBQ2hCLG9CQUFPLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckMsTUFBTSxvQkFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMzQixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLEdBQVEsRUFBRTtRQUNqRCxJQUFJLFVBQVUsR0FBSSxNQUFNLG9CQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLG9CQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzlDLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxxREFBcUQ7SUFDckQsNERBQTREO0lBQzVELG9EQUFvRDtJQUNwRCxtRkFBbUY7SUFDbkYsaUVBQWlFO0lBQ2pFLGdHQUFnRztJQUNoRyxnQ0FBZ0M7SUFDaEMsTUFBTTtJQUVOLDRFQUE0RTtJQUU1RSxNQUFNO0FBRVYsQ0FBQyxDQUFDLENBQUMifQ==