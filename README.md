Semantic Music Player
=====================

A cross-platform mobile app built with Ionic that plays back dynamic music objects (dymos).

## Installing

First install [Cordova](https://cordova.apache.org/#getstarted) and [Ionic](http://ionicframework.com/docs/intro/installation/) if you haven't yet:
```bash
$ npm install -g cordova ionic
```

Then clone the semantic-player project to your computer:
```bash
$ git clone https://github.com/semantic-player/semantic-player.git
```

Go to the cloned project folder and run:
```bash
$ npm install
```
and finally:
```bash
$ ionic serve
```

Now you can navigate to http://localhost:8100 in your browser to view the example dymo.

## Running on a mobile device

First run:
```bash
$ ionic browser add crosswalk
```
Then add the platform you are interested in, for example for Android:
```bash
$ ionic platform add android
```
Then run build, install, and run it using:
```bash
$ ionic run android
```

Check out the [Ionic docs](http://ionicframework.com/docs/) to find out how to run the app on other devices or emulators.

## Customizing the interface

The interface of the player can be customized by editing the `src/assets/config.json` file. The `showTitle` and `title` attributes allow you to edit and show or hide the title. With `showDymoSelector` the dymo selector element can be hidden, so that the player simply contains a fixed dymo. Using `showPlaybackButtons`, `showDymoControls`, and `showSensorSection` can be used to show the various parts of the interface, the playback buttons, any UI controls the dymo may define, and the section that can be used to show and debug sensor values. In case the playback buttons are hidden, the dymo can be set to play automatically upon startup by setting the `autoplay` attribute to true.

You can also set a background picture by replacing the file `www/img/background.png` with another file with the same name and extension. This works especially well if only few or none of the interface elements are shown.

## Generating the example dymos

Compile and run the generator script from the main project folder:
```bash
$ tsc -p generator/
$ node generator/lib/example-dymos.js
```

## Creating your own dymos

Add any of the [example dymos](https://github.com/florianthalmann/example-dymos.git) to the folder `www/dymos/` in the semantic-player project or build your own dymo, either by using the [Dymo Designer](https://github.com/florianthalmann/dymo-designer.git) or by defining files manually as described in the [dymo-core readme](https://github.com/semantic-player/dymo-core.git).

Declare the added dymos in the `www/config.json` file by adding them to the `"dymos"` list.

## Controls currently supported

The following table lists the sensor controls currently available for dymos in the Semantic Music Player, along with the ranges of their output values:

| Control              | @types                                         | values     | unit |
|----------------------|------------------------------------------------|------------|------|
| Slider               | Slider                                         | [0,1]      |      |
| Toggle               | Toggle                                         | {0,1}      |      |
| Button               | Button                                         | {0,1}      |      |
| Accelerometer        | AccelerometerX, AccelerometerY, AccelerometerZ | [-1,1]     |      |
| Tilt                 | TiltX, TiltY                                   | [-∞,∞]     |      |
| Compass              | CompassHeading                                 | [-180,180] | °    |
| Geolocation          | GeolocationLongitude, GeolocationLatitude      | [-180,180] | °    |
| Distance traveled    | GeolocationDistance                            | [0,∞]      | m    |
| Distance from Beacon | Beacon                                         | [0,∞]      | m    |
| Random generator     | Random                                         | [0,1]      |      |
| Random walk          | Brownian                                       | [0,1]      |      |
| Interpolating   Ramp | Ramp                                           | [0,1]      |      |

For any controls, one can set an initial value using the `value` attribute. Some of the controls can be further customized: `Beacon` can be customized using the attributes `uuid`, `major`, and `minor`. `Ramp` can be customized using `duration`.
