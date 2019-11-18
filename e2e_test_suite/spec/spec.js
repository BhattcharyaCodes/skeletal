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
const until_1 = require("selenium-webdriver/lib/until");
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
    it('should contain the "Feeling lucky button"', () => __awaiter(void 0, void 0, void 0, function* () {
        let feeling_lucky_button = protractor_1.$('input.RNmpXc[type=submit]').isPresent();
        expect(feeling_lucky_button).toBeTruthy();
    }));
    it('should contain the  "Google Search" button', () => __awaiter(void 0, void 0, void 0, function* () {
        let google_search_button = until_1.elementsLocated('input.gNO89b[value="Google Search"]');
        console.log(google_search_button);
        expect(google_search_button).toBeTruthy();
    }));
    it('should search for the input text', () => __awaiter(void 0, void 0, void 0, function* () {
        yield protractor_1.$('input.gLFyf').sendKeys(search_text, protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        let result_string = protractor_1.element(protractor_1.by.id('resultStats')).isPresent();
        expect(result_string).toBeTruthy();
    }));
    // it('should should not search anything if input belongs to {'',!, @, $,#}', async() => {
    //  let expected_string: string = "Your search - !,@,#,$ - did not match any documents.";
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should have Minimum lengths be set to 1 for the input boxes', async() => {
    // });
    // it('should have a Maximum lengths of word char for the input boxes', async() => {
    let locator_aria_label = 'gLFyf gsfi';
    let maximum_len = '2048'; //maxlength attribute name for input
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should contain the horizotnal navigation bar to group the search results', async() => {
    // let top_nav_bar = $(div#top_nav));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkY7QUFDN0Ysd0RBQStEO0FBQy9ELG1DQUFtQztBQUNuQyxnQkFBZ0I7QUFDaEIsNENBQTRDO0FBRTVDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO0lBRXRCLElBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQztJQUM5QixJQUFJLEdBQUcsR0FBRyx5QkFBeUIsQ0FBQztJQUNwQyxJQUFJLEVBQUUsR0FBRyx1QkFBVSxDQUFDLGtCQUFrQixDQUFDO0lBQ3ZDLHdCQUF3QjtJQUN4QixTQUFTLENBQUMsR0FBUSxFQUFFO1FBQ2hCLG9CQUFPLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckMsUUFBUSxDQUFDO1FBQ1QsTUFBTSxvQkFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMzQixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLEdBQVEsRUFBRTtRQUNqRCw4REFBOEQ7UUFDL0QsaUNBQWlDO1FBQ2hDLFlBQVk7UUFDWixNQUFNLENBQUMsb0JBQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG1DQUFtQyxFQUFFLEdBQVEsRUFBRTtRQUM5QyxJQUFJLFVBQVUsR0FBRyxvQkFBTyxDQUFDLGVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMxQyxNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDaEQsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNILEVBQUUsQ0FBQywyQ0FBMkMsRUFBRSxHQUFRLEVBQUU7UUFDdEQsSUFBSSxvQkFBb0IsR0FBRyxjQUFDLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN0RSxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUM5QyxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0gsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLEdBQVEsRUFBRTtRQUN2RCxJQUFJLG9CQUFvQixHQUFHLHVCQUFlLENBQUMscUNBQXFDLENBQUMsQ0FBQztRQUNsRixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDOUMsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFRLEVBQUU7UUFDN0MsTUFBTSxjQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSx1QkFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsdUJBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEYsSUFBSSxhQUFhLEdBQUcsb0JBQU8sQ0FBQyxlQUFFLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDOUQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3ZDLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCwwRkFBMEY7SUFDeEYseUZBQXlGO0lBRTNGLE1BQU07SUFFTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLGlGQUFpRjtJQUVqRixNQUFNO0lBQ04sb0ZBQW9GO0lBQ2hGLElBQUksa0JBQWtCLEdBQVcsWUFBWSxDQUFDO0lBQzlDLElBQUksV0FBVyxHQUFVLE1BQU0sQ0FBQyxDQUFDLG9DQUFvQztJQUV6RSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiw4RkFBOEY7SUFDbEcscUNBQXFDO0lBQ2pDLE1BQU07SUFFTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07QUFFVixDQUFDLENBQUMsQ0FBQyJ9