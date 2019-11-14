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
const expect_1 = require("expect");
describe('homepage', () => {
    let search_text = 'gibberish';
    let url = 'https://www.google.com/';
    let EC = protractor.ExpectedConditions;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        protractor_1.browser.waitForAngularEnabled(false);
        yield protractor_1.browser.get(url);
    }));
    it('should open the google search engine', () => __awaiter(void 0, void 0, void 0, function* () {
        expect_1.default(yield protractor_1.browser.wait(EC.urlIs(), 5000)).toEqual(url);
    }));
    //     it('should search for the input text',async() => {
    //         var search_box = await element(by.css('gLFyf gsfi'))
    //         search_box.sendKeys(search_text);
    //        // expect(search_text).toEqual(await search_box.getText());
    //         let res = await browser.wait(EC.textToBePresentInElement(search_box, search_text), 8000);
    //         expect(res).toBeTruthy();
    //     });
    //
    //     it('should be able to navigate to the first search result', async() => {
    //
    //     });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBaUY7QUFDakYsbUNBQTZCO0FBQzdCLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO0lBQ3RCLElBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQztJQUM5QixJQUFJLEdBQUcsR0FBRyx5QkFBeUIsQ0FBQztJQUNwQyxJQUFJLEVBQUUsR0FBRyxVQUFVLENBQUMsa0JBQWtCLENBQUM7SUFHdkMsVUFBVSxDQUFDLEdBQVEsRUFBRTtRQUNqQixvQkFBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sb0JBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFM0IsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRSxHQUFRLEVBQUU7UUFDakQsZ0JBQU0sQ0FBQyxNQUFNLG9CQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5RCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRVAseURBQXlEO0lBQ3pELCtEQUErRDtJQUMvRCw0Q0FBNEM7SUFDNUMscUVBQXFFO0lBQ3JFLG9HQUFvRztJQUNwRyxvQ0FBb0M7SUFDcEMsVUFBVTtJQUNWLEVBQUU7SUFDRiwrRUFBK0U7SUFDL0UsRUFBRTtJQUNGLFVBQVU7QUFFVixDQUFDLENBQUMsQ0FBQyJ9