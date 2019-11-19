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
const path_homepage_page_1 = require("../page-objects/path.homepage.page");
describe('homepage', () => {
    let hmp = new path_homepage_page_1.Homepage_page_object();
    let search_text = 'gibberish';
    let url = 'https://www.google.com/';
    let EC = protractor_1.protractor.ExpectedConditions;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        //debugger;
        yield protractor_1.browser.get(url);
    }));
    it('should open the google search engine', () => __awaiter(void 0, void 0, void 0, function* () {
        // let wait_urlIs =  await browser.wait(EC.urlIs(url), 10000);
        // debugger;
        expect(yield protractor_1.browser.getCurrentUrl()).toEqual(url);
    }));
    it('should load the google logo image', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield hmp.google_img.isPresent()).toBeTruthy();
    }));
    it('should contain the "Feeling lucky button"', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(hmp.feeling_lucky_button.isPresent()).toBeTruthy();
    }));
    it('should contain the  "Google Search" button', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield hmp.google_search_button.isPresent()).toBeTruthy();
    }));
    it('should search for the input text', () => __awaiter(void 0, void 0, void 0, function* () {
        yield hmp.input_box.sendKeys(search_text, protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(yield hmp.result_string.isPresent()).toBeTruthy();
    }));
    // it('should should not search anything if input belongs to {'',!, @, $,#}', async() => {
    //  let expected_string: string = "Your search - !,@,#,$ - did not match any documents.";
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should have Minimum lengths be set to 1 for the input boxes', async() => {
    // });
    // it('should have a Maximum lengths of word char for the input boxes', async() => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkY7QUFFN0YsMkVBQTBFO0FBRTFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO0lBQ3RCLElBQUksR0FBRyxHQUFHLElBQUkseUNBQW9CLEVBQUUsQ0FBQztJQUNyQyxJQUFJLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFDOUIsSUFBSSxHQUFHLEdBQUcseUJBQXlCLENBQUM7SUFDcEMsSUFBSSxFQUFFLEdBQUcsdUJBQVUsQ0FBQyxrQkFBa0IsQ0FBQztJQUN2QyxTQUFTLENBQUMsR0FBUSxFQUFFO1FBQ2hCLFdBQVc7UUFDWCxNQUFNLG9CQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsc0NBQXNDLEVBQUUsR0FBUSxFQUFFO1FBQ2pELDhEQUE4RDtRQUM5RCxZQUFZO1FBQ1osTUFBTSxDQUFDLE1BQU0sb0JBQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2RCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG1DQUFtQyxFQUFFLEdBQVEsRUFBRTtRQUM5QyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDMUQsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQywyQ0FBMkMsRUFBRSxHQUFRLEVBQUU7UUFDdEQsTUFBTSxDQUFFLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQy9ELENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsNENBQTRDLEVBQUUsR0FBUSxFQUFFO1FBQ3ZELE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3BFLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsa0NBQWtDLEVBQUUsR0FBUSxFQUFFO1FBQzdDLE1BQU0sR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFDLHVCQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyx1QkFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRixNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDN0QsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILDBGQUEwRjtJQUN4Rix5RkFBeUY7SUFFM0YsTUFBTTtJQUVOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04saUZBQWlGO0lBRWpGLE1BQU07SUFDTixvRkFBb0Y7SUFFcEYsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sOEZBQThGO0lBQ2xHLHFDQUFxQztJQUNqQyxNQUFNO0lBRU4sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0lBQ04sMkVBQTJFO0lBRTNFLE1BQU07SUFDTiwyRUFBMkU7SUFFM0UsTUFBTTtJQUNOLDJFQUEyRTtJQUUzRSxNQUFNO0FBRVYsQ0FBQyxDQUFDLENBQUMifQ==