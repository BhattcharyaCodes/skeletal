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
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield protractor_1.browser.get(test_data.google_home_page_url);
    }));
    it('should open the google search engine & load the google logo image in ther center of the page', () => {
        expect(protractor_1.browser.getCurrentUrl()).toEqual(test_data.google_home_page_url);
        expect(hmp.google_img.isPresent()).toBeTruthy();
        expect(hmp.google_img.getAttribute('style')).toEqual(test_data.google_img_style);
    });
    it('should contain the  "Google Search" button', () => {
        expect(hmp.google_search_button.isPresent()).toBeTruthy();
    });
    it('should contain the "Feeling lucky button" and clicking it takes you to doodle url', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(hmp.feeling_lucky_button.isPresent()).toBeTruthy();
        yield hmp.feeling_lucky_button.submit();
        //ElementNotVisibleError:
        //expect( browser.getCurrentUrl()).toEqual(test_data.doodle_url);
    }));
    it("should should not search anything if input belongs to '',!, @, $,# or is blank", () => __awaiter(void 0, void 0, void 0, function* () {
        yield hmp.input_box.sendKeys(test_data.invalid_entries[0], protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        debugger;
        expect(srp.unmatched_search_msg.isPresent()).toBeTruthy();
        expect(srp.unmatched_search_msg.getText()).toEqual(test_data.expected_string);
        yield hmp.input_box.clear();
    }));
    it('should not crash the Application, if user inserted % in search field', () => __awaiter(void 0, void 0, void 0, function* () {
        yield hmp.input_box.sendKeys(test_data.invalid_entries[3], protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(yield hmp.result_string.isPresent()).toBeTruthy();
        yield hmp.input_box.clear();
    }));
    it('should have a Maximum lengths of word char for the input boxes', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield hmp.input_box.getAttribute('maxlength')).toEqual(test_data.maximum_len);
    }));
    it('should search for the input text', () => __awaiter(void 0, void 0, void 0, function* () {
        yield hmp.input_box.sendKeys(test_data.search_text, protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(hmp.result_string.isPresent()).toBeTruthy();
        //merging with "should contain the horizotnal navigation bar" to group the search results
        expect(srp.top_nav_bar.isPresent()).toBeTruthy();
        //await hmp.input_box.clear();
    }));
    it('should be able to navigate to the first search result', () => __awaiter(void 0, void 0, void 0, function* () {
        //if condition to check if the search has returned a non-empty list 
        //locate the first element of the search list
        //.click() on the nth element form the search  list
    }));
    //search list page 
    // xit('should be able to navigate to the first search result', async() => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLnNlYXJjaC5ob21lcGFnZS5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ29vZ2xlLnNlYXJjaC5ob21lcGFnZS5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZGO0FBQzdGLDJFQUEwRSxDQUFDLFVBQVU7QUFDckYsNENBQW9ELENBQUMsVUFBVTtBQUMvRCxxRkFBeUU7QUFFekUsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7SUFDdEIsSUFBSSxHQUFHLEdBQUcsSUFBSSx5Q0FBb0IsRUFBRSxDQUFDLENBQUMsVUFBVTtJQUNoRCxJQUFJLFNBQVMsR0FBRyxJQUFJLGtDQUFzQixFQUFFLENBQUMsQ0FBQyxVQUFVO0lBQ3hELElBQUksR0FBRyxHQUFHLElBQUksMENBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFJLEVBQUUsR0FBRyx1QkFBVSxDQUFDLGtCQUFrQixDQUFDO0lBQ3ZDLFVBQVUsQ0FBQyxHQUFTLEVBQUU7UUFDbEIsTUFBTSxvQkFBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN0RCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDhGQUE4RixFQUFFLEdBQUcsRUFBRTtRQUNwRyxNQUFNLENBQUMsb0JBQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN4RSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUVyRixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw0Q0FBNEMsRUFB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