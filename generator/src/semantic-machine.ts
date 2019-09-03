import * as fs from 'fs';
import * as _ from 'lodash';
import * as wavinfo from 'wav-file-info';
import { SuperDymoStore, DymoGenerator, DymoTemplates, uris, forAll } from 'dymo-core';
import { DymoWriter } from './dymo-writer';
import { SERVER_PATH } from './server';

const LOCATION = "swindon,uk";
const WEATHER_API_KEY = "http://api.openweathermap.org/data/2.5/weather?appid=3d77879a046ee9e970e66bb2f5c5200d&q="+LOCATION;
let dymoGen: DymoGenerator;
let store: SuperDymoStore;

console.log('creating the semantic machine');
new DymoWriter('src/assets/dymo/', 'src/assets/config.json').generateAndWriteDymos([
  {name: 'semantic-machine', path: '/', func: generate}
]);


const VOCALS = ["G1Vox", "G2Vox", "G3Vox"]//, "Karaoke"];
const G1_VOICES = ["G1Flutey","G1Strings","G1Drums","G1FWave","G1Piano","G1Synth","G1LSound"]; //7
const G2_VOICES = ["G2SEnd","G2BVs","G2Bells","G2PTone","G2Drums2","G2DPad","G2Keys","G2Bass","G2SPad","G2Strings2"]; //10
const G3_VOICES = ["G3Synth2","G3Drums3","G3Bass","G3BVs","G3Drums4","G3Kick","G3Noise","G3Pedal","G3Horn","G3Strings","G3Synth1"]; //11


async function generate(gen: DymoGenerator) {
  dymoGen = gen;
  store = gen.getStore();
  return initSemanticMachine();
}

async function initSemanticMachine(): Promise<any> {
  var machine = await dymoGen.addDymo(null, null, uris.SEQUENCE);
  await dymoGen.addRendering(machine);

  //add audio and features
  const G1 = await addAudioWithFeatures(['audio/'], uris.CONJUNCTION);
  const instsG1 = [];
  /*const G2 = await addAudioWithFeatures(['audio/G2/'], uris.CONJUNCTION);
  const G3 = await addAudioWithFeatures(['audio/G3/'], uris.CONJUNCTION);*/
  //const G2 = await addAudioWithFeatures(['audio/G2/'], uris.CONJUNCTION);
  //let verseVocals = await addAudioWithFeatures('audio/G1/', uris.DISJUNCTION);
  //let chorusVocals = await addAudioWithFeatures('audio/G1/', uris.DISJUNCTION);
  const allLoops = (await store.findParts(G1))//.concat(await store.findParts(G2)).concat(await store.findParts(G3));

  //TODO OF COURSE!!!!! GROUP DYMOS!!!!!!!!!
  const vocals = await addSelectionOfSources([["Vox"]]);
  const drums = await addSelectionOfSources([["Drums", "Kick"]]);
  const bass = await addSelectionOfSources([["Bass", "BSynth"]]);
  const pads = await addSelectionOfSources([["Bells", "PTone", "Pedal", "BVs"]]);
  const ambient = await addSelectionOfSources([["SPad", "DPad", "Noise", "LSound"]]); //Horn
  const keys = await addSelectionOfSources([["Keys", "Piano", "String", "Synth"]]);

  //console.log(await store.findParts(drums), await store.findAllParents("http://tiny.cc/dymo-context/dymo10"))

  /*await dymoGen.setDymoParameter(drums, uris.DELAY, 1);
  await dymoGen.setDymoParameter(bass, uris.DELAY, 1);
  await dymoGen.setDymoParameter(pads, uris.DELAY, 1);
  /*await dymoGen.setDymoParameter(machine, uris.DELAY, 1);
  await dymoGen.setDymoParameter(machine, uris.REVERB, 1);*/

  //create sections
  //const sectionNames = ["ntro.", "V1.", "C1", "BD", "C2", "utro"];
  const sectionNames = ["I_1","I_2","V_1","V_2","V_3","C_1","C_2","BD_1","BD_2","C2_1","C2_2","C2_3","O_1"];
  //const sectionStrings = ["ntro_1", "ntro_2", "V1_1", "V1_2", "V1_3", "V1_4", "V1_5", "V1_6", "C1", "BD", "C2", "utro"];
  await mapSeries(sectionNames, s => addSongSection(machine, s));

  await addConstrainedSlider("Time of Day", machine, "timeofday", "s");

  await addConstrainedSlider("Clouds", machine, "clouds", "s");
  await dymoGen.addCustomParameter(uris.CONTEXT_URI+"clouds", machine);
  await dymoGen.addConstraint(forAll("m").in(machine)
    .forAll("l").in(drums).assert("Delay(l) == 0.3*clouds(m)", true)
  );
  await dymoGen.addConstraint(forAll("m").in(machine)
    .forAll("l").in(drums).assert("Reverb(l) == 0.07*clouds(m)", true)
  );

  await addConstrainedSlider("Humidity", machine, "humidity", "s");
  await dymoGen.addCustomParameter(uris.CONTEXT_URI+"humidity", machine);
  await dymoGen.addConstraint(forAll("m").in(machine)
    .forAll("l").in(pads).assert("Delay(l) == 0.4*clouds(m)", true)
  );
  await dymoGen.addConstraint(forAll("m").in(machine)
    .forAll("l").in(pads).assert("Reverb(l) == 0.2*clouds(m)", true)
  );


  let constraint = await createDistributionConstraint(
    machine, allLoops, "Amplitude",
    [
      {"parameter": "coldness", "feature": "logcentroid"},
      //{"parameter": "brightness", "feature": "frequency"},
      //{"parameter": "loudness", "feature": "amplitude"},
      {"parameter": "flux", "feature": "spectralflux"},
      /*{"parameter": "intensitity", "feature": "intensity"},
      {"parameter": "activity", "feature": "avgonsetfreq"},
      //{"parameter": "mood", "feature": "tuning"},
      //{"parameter": "tempoo", "feature": "tempo"}*/
    ]
  );

  //console.log(constraint.toString());
  await dymoGen.addConstraint(constraint);

  //add a constraint to keep the sum of all amplitudes constant
  /*await dymoGen.addConstraint(await createSumConstraint(machine, "WeightSum", allLoops, "Weight"));

  await dymoGen.addConstraint(
    forAll("l").in(...allLoops)
    .forAll("m").in(machine)
    .assert("Amplitude(l) == 10 * Weight(l) / WeightSum(m)", true)
  )*/

  //set voc amp
  //let vocalUris = (await store.findParts(verseVocals)).concat(await store.findParts(chorusVocals));
  //Promise.all(vocalUris.map(v => dymoGen.setDymoParameter(v, uris.DYMO_ONTOLOGY_URI+"Amplitude", 2)));

  //TEMPERATURE TO WARMTH
  /*await addConstrainedSlider("Temperature", machine, "coldness", "1-s");
  await addDataControl(machine, "coldness", "return json['main']['temp']", "1-((c-273.16+5)/20)");
  //WIND TO FLUX
  await addConstrainedSlider("Wind", machine, "flux", "1-s");
  await addDataControl(machine, "flux", "return json['wind']['speed']", "1-(c/20)");
  //CLOUDS TO INTENSITY
  /*await addConstrainedSlider("Intensity (Clouds)", machine, "intensitity");
  await addDataControl(machine, "intensitity", "return json['clouds']['all']", "c/100");
  //DAYTIME TO ACTIVITY
  await addConstrainedSlider("Activity (Time)", machine, "activity");
  await dymoGen.setDymoParameter(machine, uris.CONTEXT_URI+"activity", 0.5);
  //await addDataControl(machine, "activity", "return json['dt']", "1-Math.abs((new Date(c*1000).getHours()/12)-1);");*/

  /*await dymoGen.addCustomParameter(uris.CONTEXT_URI+"theme", machine, 0.5);
  await addConstrainedSlider("Theme", machine, "theme");

  await dymoGen.addConstraint(
    forAll("g").in(G1)
    .forAll("m").in(machine)
    .assert("Amplitude(g) == 1-theme(m)", true)
  )
  await dymoGen.addConstraint(
    forAll("g").in(G2)
    .forAll("m").in(machine)
    .assert("Amplitude(g) == theme(m)", true)
  )*/

  //await addConstrainedSlider("AMP", allLoops[2], "Amplitude");
  //await Promise.all(allLoops.map(l => map(uris.SLIDER, "A("+l+")", l, "Amplitude")));
}

async function createDistributionConstraint(topDymo: string, targets: string[], targetParam: string, dims) {
  let constraint = forAll("x").in(topDymo)
    .forAll("y").in(...targets);
  let multiplicands = await Promise.all(dims.map(async (dim,i) => {
    const param = await dymoGen.addCustomParameter(uris.CONTEXT_URI+dim.parameter, topDymo);
    let p = dim.parameter+"(x)";
    let f = dim.feature+"(y)";
    let max = (await store.getAttributeInfo())
      .filter(f => f.uri == uris.CONTEXT_URI+dim.feature)[0].max;
    return "((1-"+p+") * ("+max+"-"+f+") + "+p+"*"+f+") / "+max;
  }));
  return constraint.assert(targetParam+"(y) == " + multiplicands.join("*"), true);
}

async function createSumConstraint(sumObj: string, sumParam: string, addendObjs: string[], addendParam: string) {
  await dymoGen.addCustomParameter(uris.CONTEXT_URI+sumParam, sumObj);
  const params = await Promise.all(addendObjs.map(l =>
    dymoGen.addCustomParameter(uris.CONTEXT_URI+addendParam, l)));
  //console.log(addendObjs, params)
  let sumConstraint = forAll("s").in(sumObj);
  let addends = addendObjs.map((a,i) => {
    sumConstraint = sumConstraint.forAll("a"+i).in(a);
    return addendParam+"(a"+i+")";
  });
  return sumConstraint.assert(sumParam+"(s)=="+addends.join("+"), true);
}

async function map(controlType: string, controlName: string, dymo: string, param: string, formula: string = "c", freq?: number) {
  return constrain(controlType, controlName, dymo, param, "=="+formula, freq);
}

async function constrain(controlType: string, controlName: string, dymo: string, param: string, formula: string, freq = 200) {
  let control = await dymoGen.addControl(controlName, controlType);
  await dymoGen.getStore().setControlParam(control, uris.AUTO_CONTROL_FREQUENCY, freq);
  await dymoGen.addConstraint(
    forAll("d").in(dymo).forAll("c").in(control).assert(param+"(d)"+formula));
}

async function addSongSection(parent: string, searchName: string): Promise<string> {
  const section = await dymoGen.addDymo(parent, null, uris.CONJUNCTION);
  //add vocals
  //const vocals = await addMaterial(section, [[searchName], ["Vox"]], [], uris.DISJUNCTION);
  const vocals = await dymoGen.addDymo(section, null, uris.CONJUNCTION);
  await addVoices(vocals, [[VOCALS, [[searchName]]]]);
  await dymoGen.setDymoParameter(vocals, uris.AMPLITUDE, 0.5);
  //add material sets
  const materials = await dymoGen.addDymo(section, null,
    await addParamDependentType(uris.SELECTION, uris.CONTEXT_URI+"material"));
  const g1: [string[], string[][]] = [G1_VOICES, [[searchName], ["G1"]]];
  const g2: [string[], string[][]] = [G2_VOICES, [[searchName], ["G2"]]];
  const g3: [string[], string[][]] = [G3_VOICES, [[searchName], ["G3"]]];
  await addVoices(materials, [g1, g2]);
  await addVoices(materials, [g2, g3]);
  await addVoices(materials, [g3, g1]);
  return section;
}

async function addVoices(parent: string, voiceNamesAndSearches: [string[], string[][]][]) {
  const emptyVoice = await dymoGen.addDymo();
  const voices = await dymoGen.addDymo(parent, null,
    await addParamDependentType(uris.MULTI_SELECTION, uris.CONTEXT_URI+"instruments"));
  let duration;
  await mapSeries(voiceNamesAndSearches, async ([names, searches]) =>
    mapSeries(names, async v => {
      const selection = (await getDymosWithSources(searches.concat([[v]])))[0];
      if (selection) {
        duration = await getDuration(await store.getSourcePath(selection));
        await dymoGen.setDymoParameter(selection, uris.DURATION, duration);
        await store.addPart(voices, selection);
      } else {
        await store.addPart(voices, emptyVoice);
      }
      //console.log(vs[1], v, selection, selection? duration: "");
    })
  );
  /*console.log("VOICES", JSON.stringify(voiceNamesAndSearches, null, 2))
  console.log(voices)
  console.log(await store.findParts(voices))*/
  await dymoGen.setDymoParameter(emptyVoice, uris.DURATION, duration);
}

async function addParamDependentType(dymoType: string, paramType: string) {
  const param = await store.setParameter(null, paramType);
  const type = await store.addTriple(null, uris.TYPE, dymoType);
  await store.addTriple(type, uris.HAS_TYPE_PARAM, param);
  return type;
}

async function getDuration(audio: string): Promise<any> {
  return new Promise((resolve, reject) => {
    wavinfo.infoByFilename(audio.replace('.m4a','.wav'), (err, info) => {
      if (err) reject(err);
      resolve(info.duration);
    });
  })
}

/*async function addMaterial(parent: string, searchStrings: string[][], excludeStrings: string[] = [], dymoType = uris.MULTI_SELECTION) {
  const selection = await getDymosWithSources(searchStrings, excludeStrings);
  const material = await dymoGen.addDymo(parent, null, dymoType);
  await Promise.all(selection.map(p => store.addPart(material, p)));
  return material;
}*/

async function addAudioWithFeatures(dirs: string[], dymoType: string): Promise<string> {
  const sourcesAndFeatures = dirs.map(d => loadSourcesAndFeatures(d));
  const sources = _.union(sourcesAndFeatures.map((s,i) => s[0].map(f => dirs[i]+f))[0]);
  const features = _.union(sourcesAndFeatures.map(s => s[1])[0]);
  return DymoTemplates.createMultiSourceDymo(dymoGen, null, dymoType, sources, features);
}

async function addSelectionOfSources(includeStrings: string[][], excludeStrings: string[] = [], dymoType = uris.CONJUNCTION) {
  var setDymos = await getDymosWithSources(includeStrings, excludeStrings);
  var setUri = await dymoGen.addDymo(null, null, dymoType);
  await Promise.all(setDymos.map(d=>store.addPart(setUri, d)));
  return setUri;
}

//includeStrings is a conjunction of disjunctions ([["" or ""] and [""]])
async function getDymosWithSources(includeStrings: string[][], excludeStrings: string[] = []) {
  const allSources = await store.findAllObjectValues(null, uris.HAS_SOURCE);
  let setSources = allSources.filter(so =>
    includeStrings.every(is => is.some(s => so.indexOf(s) >= 0)));
  //console.log(includeStrings, setSources)
  setSources = setSources.filter(so => excludeStrings.every(s => so.indexOf(s) < 0));
  return Promise.all(setSources.map(s=>store.findSubject(uris.HAS_SOURCE, s)));
}

async function addConstrainedSlider(sliderName: string, dymo: string, targetParam: string, sliderFunc = "s") {
  const slider = await addSlider(sliderName);
  //let sliderFunc = invert ? "1-s" : "s";
  await dymoGen.addConstraint(
    forAll("s").in(slider).forAll("d").in(dymo).assert(targetParam+"(d) == "+sliderFunc));
}

async function addSlider(sliderName: string) {
  const slider = await dymoGen.addControl(sliderName, uris.SLIDER);
  await store.setControlParam(slider, uris.AUTO_CONTROL_FREQUENCY, 500);
  return slider;
}

async function addDataControl(dymo: string, targetParam: string, jsonMap: string, dataFunc: string) {
  let dataControl = await dymoGen.addDataControl(WEATHER_API_KEY, jsonMap);
  await dymoGen.addConstraint(
    forAll("c").in(dataControl).forAll("d").in(dymo).assert(targetParam+"(d) == "+dataFunc, true));
}

function loadSourcesAndFeatures(dir: string): [string[], string[][]] {
  let sourceFiles = getSourceFiles(dir);
  let featureFiles = getFeatureFiles(dir);
  let groupedFeatureFiles = sourceFiles.map(s =>
    featureFiles.filter(f => f.indexOf(removeFileExtension(s)+'_') >= 0)
      .map(f => SERVER_PATH+dir+f));
  return [sourceFiles, groupedFeatureFiles];
}

function getSourceFiles(dir: string): string[] {
  return getFilenames(dir, ['.m4a']);
}

function getFeatureFiles(dir: string): string[] {
  return getFilenames(dir, ['.json']);
}

function getFilenames(dir: string, extensions?: string[]): string[] {
  const files = fs.readdirSync(dir);
  return files.filter(f => extensions.some(e => f.indexOf(e) >= 0));
}

function readFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, content) => {
      if (err) reject(err);
      resolve(content);
    });
  });
}

function removeFileExtension(path: string): string {
  return path.slice(0, path.lastIndexOf('.'));
}

async function mapSeries<T,S>(array: T[], func: (arg: T, i: number) => Promise<S>): Promise<S[]> {
  let result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(await func(array[i], i));
  }
  return result;
}