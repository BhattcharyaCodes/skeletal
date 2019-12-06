import {browser, by , By, element, $, $$, protractor, ExpectedConditions} from 'protractor';

export class GooglemapsHomePage{
    maps_input = $("input[aria-label='Search Google Maps']");
    maps_search_btn = $("button#searchbox-searchbutton");
    maps_search_dir = $("button#searchbox-directions");
    maps_search_result_area = $("div.section-hero-header-title-description");
    maps_search_result_h1 = $("h1.GLOBAL__gm2-headline-5.section-hero-header-title-title");
    maps_search_result_dir_icon = $("img.iRxY3GoUYUY__icon[alt='Directions']");
    maps_search_input_start_location = $("input.tactile-searchbox-input[aria-label='Starting point Your location']");
    maps_search_current_location = $("div.widget-mylocation-button-icon-common");
    mpas_travel_mode_walking = $("div[aria-label='Walking']");
    maps_send_dir_on_phone = $("button.blue-link.section-directions-action-button");
    maps_send_options_modal = $("div.modal-dialog-content");
}