import { browser, element, by, By, $, $$, ExpectedConditions, protractor } from 'protractor';
import { GooglemapsHomePage } from '../page-objects/maps.homepage.page';
// import GooglemapsHomePage from '../page-objects/maps.homepage.page';


describe('GooglemapsHomePage testing', ()=>{

    let url = "https://www.google.com/maps/";
    let mapshomepageobject = new GooglemapsHomePage();
    let EC = protractor.ExpectedConditions;

    beforeEach(async()=>{
        await browser.get(url);
    });

    it('should open the google maps home page',()=>{
        expect(browser.getCurrentUrl()).toEqual(url);
    });

    it('should search for the given location', async()=>{
        await mapshomepageobject.maps_input.sendKeys("Sakra Hospital", protractor.Key.ENTER, protractor.Key.NULL);
        expect(mapshomepageobject.maps_search_result_h1).toBeTruthy();
        
    });

    it('should calculate the distance betweeen the current location and given location',async()=>{
        await mapshomepageobject.maps_input.sendKeys("Sakra Hospital", protractor.Key.ENTER, protractor.Key.NULL);
        expect(mapshomepageobject.maps_search_result_dir_icon).toBeTruthy();
        await mapshomepageobject.maps_search_result_dir_icon.click();
        expect(mapshomepageobject.maps_search_input_start_location).toBeTruthy();
        await mapshomepageobject.maps_search_current_location.click();
        expect(mapshomepageobject.mpas_travel_mode_walking).toBeTruthy();
        await mapshomepageobject.mpas_travel_mode_walking.click();
        // await mapshomepageobject.maps_send_dir_on_phone.click();
        // expect(mapshomepageobject.maps_send_options_modal).toBeTruthy();
    });

    it('should implement dragging the pointer to a different location on the maps', async()=>{
        let el1 = $$("div.widget-directions-icon").get(2);
        let el2 = $$("div.widget-directions-icon").get(6);
        await mapshomepageobject.maps_input.sendKeys("Sakra Hospital", protractor.Key.ENTER, protractor.Key.NULL);
        expect(mapshomepageobject.maps_search_result_dir_icon).toBeTruthy();
        await mapshomepageobject.maps_search_result_dir_icon.click();
        //1st way: dragging one element to another
        await browser.actions().mouseDown(el1).mouseMove(el2).mouseUp().perform();
        let location2 = $$("input.tactile-searchbox-input").get(3);
        expect(location2.getAttribute('value')).toEqual('Your location');
        
        //2md way: dragAndDrop convenience action
        // browser.actions().dragAndDrop(el1, el2).perform();

        //3rd way: specifying offset, instead of target element, in pixels
        // browser.actions().mouseMove(el1).mouseMove({x: 50, y:0}).doubleClick().perform();
        //sidenot check why doubleClick() is used instead of click action



    });
});