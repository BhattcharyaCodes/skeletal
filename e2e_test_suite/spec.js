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
    let EC = protractor_1.protractor.ExpectedConditions;
    // let browser_url: any;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        protractor_1.browser.waitForAngularEnabled(false);
        debugger;
        yield protractor_1.browser.get(url);
    }));
    it('should open the google search engine', () => __awaiter(void 0, void 0, void 0, function* () {
        // let wait_urlIs =  await browser.wait(EC.urlIs(url), 10000);
        // expect(url).toBe(wait_urlIs); 
        // debugger;
        expect(protractor_1.browser.getCurrentUrl()).toEqual(url);
    }));
    it('should load the google logo image', () => __awaiter(void 0, void 0, void 0, function* () {
        let google_img = protractor_1.element(protractor_1.by.id('hplogo'));
        expect(google_img.isPresent()).toBeTruthy();
    }));
    it('should search for the input text', () => __awaiter(void 0, void 0, void 0, function* () {
        var search_box_locator = "input.['gLFyf gsfi']";
        let search_box = yield protractor_1.$(search_box_locator);
        search_box.sendKeys(search_text, protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        //let res = 
        // await browser.wait(EC.textToBePresentInElement(search_box, search_text), 8000);
        expect(yield protractor_1.browser.wait(EC.textToBePresentInElement(search_box, search_text), 8000)).toBeTruthy();
    }));
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkY7QUFDN0YsbUNBQW1DO0FBQ25DLGdCQUFnQjtBQUNoQiw0Q0FBNEM7QUFFNUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7SUFFdEIsSUFBSSxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBQzlCLElBQUksR0FBRyxHQUFHLHlCQUF5QixDQUFDO0lBQ3BDLElBQUksRUFBRSxHQUFHLHVCQUFVLENBQUMsa0JBQWtCLENBQUM7SUFDdkMsd0JBQXdCO0lBQ3hCLFNBQVMsQ0FBQyxHQUFRLEVBQUU7UUFDaEIsb0JBQU8sQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxRQUFRLENBQUM7UUFDVCxNQUFNLG9CQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsc0NBQXNDLEVBQUUsR0FBUSxFQUFFO1FBQ2pELDhEQUE4RDtRQUMvRCxpQ0FBaUM7UUFDaEMsWUFBWTtRQUNaLE1BQU0sQ0FBQyxvQkFBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pELENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsbUNBQW1DLEVBQUUsR0FBUSxFQUFFO1FBQzlDLElBQUksVUFBVSxHQUFHLG9CQUFPLENBQUMsZUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUNoRCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGtDQUFrQyxFQUFFLEdBQVEsRUFBRTtRQUM3QyxJQUFJLGtCQUFrQixHQUFHLHNCQUFzQixDQUFDO1FBQ2hELElBQUksVUFBVSxHQUFHLE1BQU0sY0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDN0MsVUFBVSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsdUJBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLHVCQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVFLFlBQVk7UUFDWixrRkFBa0Y7UUFDbEYsTUFBTSxDQUFDLE1BQU0sb0JBQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3hHLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCwyRUFBMkU7SUFFM0UsTUFBTTtJQUVOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0FBRVYsQ0FBQyxDQUFDLENBQUMifQ==