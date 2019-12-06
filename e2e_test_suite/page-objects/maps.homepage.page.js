"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
class GooglemapsHomePage {
    constructor() {
        this.maps_input = protractor_1.$("input[aria-label='Search Google Maps']");
        this.maps_search_btn = protractor_1.$("button#searchbox-searchbutton");
        this.maps_search_dir = protractor_1.$("button#searchbox-directions");
        this.maps_search_result_area = protractor_1.$("div.section-hero-header-title-description");
        this.maps_search_result_h1 = protractor_1.$("h1.GLOBAL__gm2-headline-5.section-hero-header-title-title");
        this.maps_search_result_dir_icon = protractor_1.$("img.iRxY3GoUYUY__icon[alt='Directions']");
        this.maps_search_input_start_location = protractor_1.$("input.tactile-searchbox-input[aria-label='Starting point Your location']");
        this.maps_search_current_location = protractor_1.$("div.widget-mylocation-button-icon-common");
        this.mpas_travel_mode_walking = protractor_1.$("div[aria-label='Walking']");
        this.maps_send_dir_on_phone = protractor_1.$("button.blue-link.section-directions-action-button");
        this.maps_send_options_modal = protractor_1.$("div.modal-dialog-content");
    }
}
exports.GooglemapsHomePage = GooglemapsHomePage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwcy5ob21lcGFnZS5wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFwcy5ob21lcGFnZS5wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTRGO0FBRTVGLE1BQWEsa0JBQWtCO0lBQS9CO1FBQ0ksZUFBVSxHQUFHLGNBQUMsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBQ3pELG9CQUFlLEdBQUcsY0FBQyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDckQsb0JBQWUsR0FBRyxjQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUNuRCw0QkFBdUIsR0FBRyxjQUFDLENBQUMsMkNBQTJDLENBQUMsQ0FBQztRQUN6RSwwQkFBcUIsR0FBRyxjQUFDLENBQUMsMkRBQTJELENBQUMsQ0FBQztRQUN2RixnQ0FBMkIsR0FBRyxjQUFDLENBQUMseUNBQXlDLENBQUMsQ0FBQztRQUMzRSxxQ0FBZ0MsR0FBRyxjQUFDLENBQUMsMEVBQTBFLENBQUMsQ0FBQztRQUNqSCxpQ0FBNEIsR0FBRyxjQUFDLENBQUMsMENBQTBDLENBQUMsQ0FBQztRQUM3RSw2QkFBd0IsR0FBRyxjQUFDLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUMxRCwyQkFBc0IsR0FBRyxjQUFDLENBQUMsbURBQW1ELENBQUMsQ0FBQztRQUNoRiw0QkFBdUIsR0FBRyxjQUFDLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUM1RCxDQUFDO0NBQUE7QUFaRCxnREFZQyJ9