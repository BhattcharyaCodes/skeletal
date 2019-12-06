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
    let homepage = new path_homepage_page_1.Homepage_page_object(); //refactor
    let test_data = new constants_1.Test_data_declarations(); //refactor
    let srp = new path_search_result_page_1.SearchResultPage();
    let EC = protractor_1.protractor.ExpectedConditions;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield protractor_1.browser.get(test_data.google_home_page_url);
    }));
    it('should open the google search engine & load the google logo image in ther center of the page', () => {
        expect(protractor_1.browser.getCurrentUrl()).toEqual(test_data.google_home_page_url);
        expect(homepage.google_img.isPresent()).toBeTruthy();
        expect(homepage.google_img.getAttribute('style')).toEqual(test_data.google_img_style);
    });
    it('should be able to select the voice search option', () => {
        expect(homepage.voice_search_icon.isPresent()).toBeTruthy();
        homepage.voice_search_icon.click();
        //advance : check the search message that comes onmouseover event of this button
    });
    it('should contain the  "Google Search" button', () => {
        expect(homepage.google_search_button.isPresent()).toBeTruthy();
    });
    it('should contain the "Feeling lucky button" and clicking it takes you to doodle url', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(homepage.feeling_lucky_button.isPresent()).toBeTruthy();
        yield homepage.feeling_lucky_button.submit();
        yield protractor_1.browser.manage().timeouts().pageLoadTimeout(5000);
        //ElementNotVisibleError:
        expect(protractor_1.browser.getCurrentUrl()).toEqual(test_data.doodle_url);
    }));
    it("should should not search anything if input belongs to '',!, @, $,# or is blank", () => __awaiter(void 0, void 0, void 0, function* () {
        yield homepage.input_box.sendKeys(test_data.invalid_entries[0], protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        debugger;
        expect(srp.unmatched_search_msg.isPresent()).toBeTruthy();
        expect(srp.unmatched_search_msg.getText()).toEqual(test_data.expected_string);
        yield homepage.input_box.clear();
    }));
    it('should not crash the Application, if user inserted % in search field', () => __awaiter(void 0, void 0, void 0, function* () {
        yield homepage.input_box.sendKeys(test_data.invalid_entries[3], protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(yield homepage.result_string.isPresent()).toBeTruthy();
        yield homepage.input_box.clear();
    }));
    it('should have a Maximum lengths of word char for the input boxes', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield homepage.input_box.getAttribute('maxlength')).toEqual(test_data.maximum_len);
    }));
    it('should search for the input text', () => __awaiter(void 0, void 0, void 0, function* () {
        yield homepage.input_box.sendKeys(test_data.search_text, protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(homepage.result_string.isPresent()).toBeTruthy();
        expect(srp.top_nav_bar.isPresent()).toBeTruthy();
        yield homepage.input_box.clear();
    }));
    it('should be able to navigate to the first search result', () => __awaiter(void 0, void 0, void 0, function* () {
        //if condition to check if the search has returned a non-empty list 
        //locate the first element of the search list
        //.click() on the nth element form the search  list
    }));
    //search list page 
    it('should be able to load the image result which can be clicked', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(homepage.image_tab_locator.isPresent()).toBeTruthy();
        yield homepage.image_tab_locator.click();
        // expect(homepage.image_result_list.isPresent()).toBeTruthy();
    }));
    // it('should be able to load the video result which can be clicked', async() => {
    // });
    it('should be able to suggest auto complete when the user start typing word in text box which matches typed keyword', () => __awaiter(void 0, void 0, void 0, function* () {
        //check f auto complete comes up at all
        //need to match the auto result with the input text
    }));
    it('should be able to navigate back to the initial search result', () => __awaiter(void 0, void 0, void 0, function* () {
    }));
    it('should be able to load searchistory  after clicking Search field', () => __awaiter(void 0, void 0, void 0, function* () {
    }));
    it('should be able to navigate to the different paginated search result', () => __awaiter(void 0, void 0, void 0, function* () {
    }));
    it('should be display the total number of first search result', () => __awaiter(void 0, void 0, void 0, function* () {
    }));
    // it('should be able to navigate to the first search result', async() => {
    // });
    // it('should be able to navigate to the first search result', async() => {
    // });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLnNlYXJjaC5ob21lcGFnZS5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ29vZ2xlLnNlYXJjaC5ob21lcGFnZS5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZGO0FBQzdGLDJFQUEwRSxDQUFDLFVBQVU7QUFDckYsNENBQW9ELENBQUMsVUFBVTtBQUMvRCxxRkFBeUU7QUFFekUsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7SUFDdEIsSUFBSSxRQUFRLEdBQUcsSUFBSSx5Q0FBb0IsRUFBRSxDQUFDLENBQUMsVUFBVTtJQUNyRCxJQUFJLFNBQVMsR0FBRyxJQUFJLGtDQUFzQixFQUFFLENBQUMsQ0FBQyxVQUFVO0lBQ3hELElBQUksR0FBRyxHQUFHLElBQUksMENBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFJLEVBQUUsR0FBRyx1QkFBVSxDQUFDLGtCQUFrQixDQUFDO0lBQ3ZDLFVBQVUsQ0FBQyxHQUFTLEVBQUU7UUFDbEIsTUFBTSxvQkFBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN0RCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDhGQUE4RixFQUFFLEdBQUcsRUFBRTtRQUNwRyxNQUFNLENBQUMsb0JBQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN4RSxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3JELE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUUxRixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxrREFBa0QsRUFB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