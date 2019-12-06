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
const maps_homepage_page_1 = require("../page-objects/maps.homepage.page");
// import GooglemapsHomePage from '../page-objects/maps.homepage.page';
describe('GooglemapsHomePage testing', () => {
    let url = "https://www.google.com/maps/";
    let mapshomepageobject = new maps_homepage_page_1.GooglemapsHomePage();
    let EC = protractor_1.protractor.ExpectedConditions;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield protractor_1.browser.get(url);
    }));
    it('should open the google maps home page', () => {
        expect(protractor_1.browser.getCurrentUrl()).toEqual(url);
    });
    it('should search for the given location', () => __awaiter(void 0, void 0, void 0, function* () {
        yield mapshomepageobject.maps_input.sendKeys("Sakra Hospital", protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(mapshomepageobject.maps_search_result_h1).toBeTruthy();
    }));
    it('should calculate the distance betweeen the current location and given location', () => __awaiter(void 0, void 0, void 0, function* () {
        yield mapshomepageobject.maps_input.sendKeys("Sakra Hospital", protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(mapshomepageobject.maps_search_result_dir_icon).toBeTruthy();
        yield mapshomepageobject.maps_search_result_dir_icon.click();
        expect(mapshomepageobject.maps_search_input_start_location).toBeTruthy();
        yield mapshomepageobject.maps_search_current_location.click();
        expect(mapshomepageobject.mpas_travel_mode_walking).toBeTruthy();
        yield mapshomepageobject.mpas_travel_mode_walking.click();
        // await mapshomepageobject.maps_send_dir_on_phone.click();
        // expect(mapshomepageobject.maps_send_options_modal).toBeTruthy();
    }));
    it('should implement dragging the pointer to a different location on the maps', () => __awaiter(void 0, void 0, void 0, function* () {
        let el1 = protractor_1.$$("div.widget-directions-icon").get(2);
        let el2 = protractor_1.$$("div.widget-directions-icon").get(6);
        yield mapshomepageobject.maps_input.sendKeys("Sakra Hospital", protractor_1.protractor.Key.ENTER, protractor_1.protractor.Key.NULL);
        expect(mapshomepageobject.maps_search_result_dir_icon).toBeTruthy();
        yield mapshomepageobject.maps_search_result_dir_icon.click();
        //1st way: dragging one element to another
        yield protractor_1.browser.actions().mouseDown(el1).mouseMove(el2).mouseUp().perform();
        let location2 = protractor_1.$$("input.tactile-searchbox-input").get(3);
        expect(location2.getAttribute('value')).toEqual('Your location');
        //2md way: dragAndDrop convenience action
        // browser.actions().dragAndDrop(el1, el2).perform();
        //3rd way: specifying offset, instead of target element, in pixels
        // browser.actions().mouseMove(el1).mouseMove({x: 50, y:0}).doubleClick().perform();
        //sidenot check why doubleClick() is used instead of click action
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwcy5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFwcy5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZGO0FBQzdGLDJFQUF3RTtBQUN4RSx1RUFBdUU7QUFHdkUsUUFBUSxDQUFDLDRCQUE0QixFQUFFLEdBQUUsRUFBRTtJQUV2QyxJQUFJLEdBQUcsR0FBRyw4QkFBOEIsQ0FBQztJQUN6QyxJQUFJLGtCQUFrQixHQUFHLElBQUksdUNBQWtCLEVBQUUsQ0FBQztJQUNsRCxJQUFJLEVBQUUsR0FBRyx1QkFBVSxDQUFDLGtCQUFrQixDQUFDO0lBRXZDLFVBQVUsQ0FBQyxHQUFPLEVBQUU7UUFDaEIsTUFBTSxvQkFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMzQixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHVDQUF1QyxFQUFDLEdBQUUsRUFBRTtRQUMzQyxNQUFNLENBQUMsb0JBQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRSxHQUFPLEVBQUU7UUFDaEQsTUFBTSxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLHVCQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSx1QkFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxRyxNQUFNLENBQUMsa0JBQWtCLENBQUMscUJBQXFCLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUVsRSxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGdGQUFnRixFQUFDLEdBQU8sRUFBRTtRQUN6RixNQUFNLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsdUJBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLHVCQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFHLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3BFLE1BQU0sa0JBQWtCLENBQUMsMkJBQTJCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0QsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGdDQUFnQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDekUsTUFBTSxrQkFBa0IsQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5RCxNQUFNLENBQUMsa0JBQWtCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNqRSxNQUFNLGtCQUFrQixDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFELDJEQUEyRDtRQUMzRCxtRUFBbUU7SUFDdkUsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQywyRUFBMkUsRUFBRSxHQUFPLEVBQUU7UUFDckYsSUFBSSxHQUFHLEdBQUcsZUFBRSxDQUFDLDRCQUE0QixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELElBQUksR0FBRyxHQUFHLGVBQUUsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRCxNQUFNLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsdUJBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLHVCQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFHLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3BFLE1BQU0sa0JBQWtCLENBQUMsMkJBQTJCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0QsMENBQTBDO1FBQzFDLE1BQU0sb0JBQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFFLElBQUksU0FBUyxHQUFHLGVBQUUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRCxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUVqRSx5Q0FBeUM7UUFDekMscURBQXFEO1FBRXJELGtFQUFrRTtRQUNsRSxvRkFBb0Y7UUFDcEYsaUVBQWlFO0lBSXJFLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyJ9