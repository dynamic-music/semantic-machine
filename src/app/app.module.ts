import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { DeviceMotion } from '@ionic-native/device-motion';
import { DeviceOrientation } from '@ionic-native/device-orientation';
import { Geolocation } from '@ionic-native/geolocation';

import { AppComponent } from './app.component';
import { PlayerComponent } from './player.component';

import { ConfigService } from './services/config.service';
import { FetchService } from './services/fetch.service';
import { AccelerationService } from './sensors/acceleration.service';
import { OrientationService } from './sensors/orientation.service';
import { GeolocationService } from './sensors/geolocation.service';

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(AppComponent)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    AppComponent,
    PlayerComponent
  ],
  providers: [
    StatusBar,
    SplashScreen,
    ConfigService,
    FetchService,
    DeviceOrientation,
    Geolocation,
    DeviceMotion,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    AccelerationService,
    OrientationService,
    GeolocationService
  ]
})
export class AppModule {}
