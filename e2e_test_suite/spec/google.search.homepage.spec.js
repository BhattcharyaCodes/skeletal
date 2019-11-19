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
const path_homepage_page_1 = require("../page-objects/path.homepage.page"); //refactor
const constants_1 = require("../constants"); //refactor
const path_search_result_page_1 = require("../page-objects/path.search_result.page");
describe('homepage', () => {
    let hmp = new path_homepage_page_1.Homepage_page_object(); //refactor
    let test_data = new constants_1.Test_data_declarations(); //refactor
    let srp = new path_search_result_page_1.SearchResultPage();
    let EC = protractor_1.protractor.ExpectedConditions;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield protractor_1.browser.get(test_data.google_home_page_url);
    }));
    it('should open the google search engine & load the google logo image in ther center of the page', () => {
        expect(protractor_1.browser.getCurrentUrl()).toEqual(test_data.google_home_page_url);
        expect(hmp.google_img.isPresent()).toBeTruthy();
        expect(hmp.google_img.getAttribute('style')).toEqual(test_data.google_img_style);
    });
    // xit('should contain the "Feeling lucky button" and clicking it takes you to doodle url', async() => {
    //     expect(  hmp.feeling_lucky_button.isElementPresent()).toBeTruthy();
    //     await hmp.feeling_lucky_button.click();
    //     expect(await browser.getCurrentUrl()).toEqual(test_data.doodle_url);
    // });
    it('should contain the  "Google Search" button', () => {
        expect(hmp.google_search_button.isPresent()).toBeTruthy();
    });
    it('should search for the input text', () => __awaiter(void 0, void 0, void 0, function* () {
        yield hmp.input_box.sendKeys(test_data.search_text, protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(hmp.result_string.isPresent()).toBeTruthy();
        //merging with should contain the horizotnal navigation bar to group the search results
        expect(srp.top_nav_bar.isPresent()).toBeTruthy();
        yield hmp.input_box.clear();
    }));
    it("should should not search anything if input belongs to '',!, @, $,# or is blank", () => __awaiter(void 0, void 0, void 0, function* () {
        yield hmp.input_box.sendKeys(test_data.invalid_entries[0], protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        debugger;
        expect(srp.unmatched_search_msg.isPresent()).toBeTruthy();
        //invalid_inputs .toEqual(expected_string);
        //console.log(srp.unmatched_search_msg.getText());
        expect(srp.unmatched_search_msg.getText()).toEqual(test_data.expected_string);
    }));
    it('should be able to navigate to the first search result', () => __awaiter(void 0, void 0, void 0, function* () {
        //if condition to check if the search has returned a non-empty list 
        //locate the first element of the search list
        //.click() on the nth element form the search  list
        //
    }));
    it('should have a Maximum lengths of word char for the input boxes', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield hmp.input_box.getAttribute('maxlength')).toEqual(test_data.maximum_len);
    }));
    //search list page 
    xit('should be able to navigate to the first search result', () => __awaiter(void 0, void 0, void 0, function* () {
    }));
    it('should not crash the Application, if user inserted % in search field', () => __awaiter(void 0, void 0, void 0, function* () {
        yield hmp.input_box.sendKeys(test_data.invalid_entries[3], protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(yield hmp.result_string.isPresent()).toBeTruthy();
        //expect();
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLnNlYXJjaC5ob21lcGFnZS5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ29vZ2xlLnNlYXJjaC5ob21lcGFnZS5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZGO0FBRTdGLDJFQUEwRSxDQUFDLFVBQVU7QUFDckYsNENBQW9ELENBQUMsVUFBVTtBQUMvRCxxRkFBeUU7QUFFekUsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7SUFDdEIsSUFBSSxHQUFHLEdBQUcsSUFBSSx5Q0FBb0IsRUFBRSxDQUFDLENBQUMsVUFBVTtJQUNoRCxJQUFJLFNBQVMsR0FBRyxJQUFJLGtDQUFzQixFQUFFLENBQUMsQ0FBQyxVQUFVO0lBQ3hELElBQUksR0FBRyxHQUFHLElBQUksMENBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFJLEVBQUUsR0FBRyx1QkFBVSxDQUFDLGtCQUFrQixDQUFDO0lBQ3ZDLFNBQVMsQ0FBQyxHQUFTLEVBQUU7UUFDakIsTUFBTSxvQkFBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN0RCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDhGQUE4RixFQUFFLEdBQUcsRUFBRTtRQUNwRyxNQUFNLENBQUMsb0JBQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN4RSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUVyRixDQUFDLENBQUMsQ0FBQztJQUVILHdHQUF3RztJQUN4RywwRUFBMEU7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