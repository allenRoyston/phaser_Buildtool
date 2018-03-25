declare var Phaser:any;

// imports must be added in gulpFile as well
//removeIf(gameBuild)
import {PHASER_MASTER} from './../exports/master'
import {PHASER_CONTROLS} from './../exports/controller'
import {PHASER_MOUSE} from './../exports/mouse'
import {PHASER_AUDIO} from './../exports/audio'
import {PHASER_PRELOADER} from './../exports/preloader'
import {PHASER_SPRITE_MANAGER} from './../exports/spriteManager'
import {PHASER_TEXT_MANAGER} from './../exports/textManager'
import {PHASER_BUTTON_MANAGER} from './../exports/buttonManager'
import {PHASER_BITMAPDATA_MANAGER} from './../exports/bitmapdataManager'
import {PHASER_GROUP_MANAGER} from './../exports/groupManager'

import {WEAPON_MANAGER} from './required/weaponManager'
//endRemoveIf(gameBuild)

class PhaserGameObject {
    // this properties
    global:any;
    game:any;

    /******************/
    constructor(){
      // accessible in gameObject as _this, accessible in class functions as this (obviously)
      this.game = null;
      this.global = {
        pause: false
      };
    }
    /******************/

    /******************/
    public init(el:any, parent:any, options:any){

      /******************/
      // declare variables BOILERPLATE
      // initiate control class
      const phaserMaster = new PHASER_MASTER({game: new Phaser.Game(options.width, options.height, Phaser.WEBGL, el, { preload: preload, create: create, update: update}), resolution: {width: options.width, height: options.height}}),
            phaserControls = new PHASER_CONTROLS(),
            phaserMouse = new PHASER_MOUSE({showDebugger: false}),
            phaserSprites = new PHASER_SPRITE_MANAGER(),
            phaserBmd = new PHASER_BITMAPDATA_MANAGER(),
            phaserTexts = new PHASER_TEXT_MANAGER(),
            phaserButtons = new PHASER_BUTTON_MANAGER(),
            phaserGroup = new PHASER_GROUP_MANAGER(),
            phaserBitmapdata = new PHASER_BITMAPDATA_MANAGER(),
            weaponManager = new WEAPON_MANAGER();

      const store = options.store;
      let gameDataCopy = JSON.stringify(store.getters._gameData());
      phaserMaster.let('gameData', JSON.parse(gameDataCopy))
      /******************/

      /******************/
      function saveData(prop:string, value:any){
        let gameData = phaserMaster.get('gameData')
          gameData[prop] = value;
      }

      function updateStore(){
        let gameData = phaserMaster.get('gameData')
        store.commit('setGamedata', gameData)
      }
      /******************/

      /******************/
      function preload(){
        let game = phaserMaster.game();
        // load resources in parellel
        game.load.enableParallel = true;

        // set canvas color
        game.stage.backgroundColor = '#2f2f2f';
        let folder = 'src/phaser/saveTheWorld/resources'

        // atlas
        game.load.atlas('atlas', `${folder}/spritesheets/heroSelect/heroSelectAtlas.png`, `${folder}/spritesheets/heroSelect/heroSelectAtlas.json`, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        game.load.atlas('atlas_main', `${folder}/spritesheets/main/main.png`, `${folder}/spritesheets/main/main.json`, Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);
        game.load.atlas('atlas_weapons', `${folder}/spritesheets/weapons/weaponsAtlas.png`, `${folder}/spritesheets/weapons/weaponsAtlas.json`, Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);

        // font
        game.load.bitmapFont('gem', `${folder}/fonts/gem.png`, `${folder}/fonts/gem.xml`);

        // json
        game.load.json('weaponData', `${folder}/json/weaponData.json`);
        game.load.json('pilotData', `${folder}/json/pilotData.json`);

        // change state
        phaserMaster.changeState('PRELOAD')

        // send to preloader class
        new PHASER_PRELOADER({game: game, delayInSeconds: 0, done: () => {preloadComplete()}})
      }
      /******************/

      /******************/
      function create(){
        let game = phaserMaster.game();
        // assign game to classes
        phaserControls.assign(game)
        phaserMouse.assign(game)
        phaserSprites.assign(game)
        phaserBmd.assign(game)
        phaserTexts.assign(game)
        phaserButtons.assign(game)
        phaserGroup.assign(game, 20)
        phaserBitmapdata.assign(game)
        weaponManager.assign(game, phaserMaster, phaserSprites, phaserGroup, 'atlas_weapons')

        // phaserMaster
        let currentSelection = phaserMaster.let('currentSelection', 0)
        let pilotSelection = phaserMaster.let('pilotSelection', 0)
        let loadoutSelection = phaserMaster.let('loadoutSelection', 0)
        let primaryWeaponSelection = phaserMaster.let('primaryWeaponSelection', 0)
        let subWeaponSelection = phaserMaster.let('subWeaponSelection', 0)
        let perkSelection = phaserMaster.let('perkSelection', 0)
        let weaponData = phaserMaster.let('weaponData', game.cache.getJSON('weaponData'));
        let pilotData = phaserMaster.let('pilotData', game.cache.getJSON('pilotData'));

        let screenSplitX = this.game.world.width - 240
        let screenSplitY = this.game.world.height/2

        // frames
        let verticleFrame = phaserSprites.addFromAtlas({x: screenSplitX, y: 0, height: game.world.height, name: `verticleFrame`, group: 'ui_frame', filename: 'ui_frame_v.png', atlas: 'atlas'})
        let dividerFrame1 = phaserSprites.addFromAtlas({x: 0, y: screenSplitY, width: verticleFrame.x, name: `dividerFrame1`, group: 'ui_frame', filename: 'ui_frame_h.png', atlas: 'atlas'})

        // mask containers
        let bmd = phaserBitmapdata.addGradient({name: 'overlayFadeout', start: '#ffffff', end: '#ffffff', width: 1, height: 1, render: false})
        let container_1 = phaserSprites.add({x: 0, y: 0, name: `container_1`, width: screenSplitX, height: screenSplitY, reference: bmd.cacheBitmapData, visible: false})
        let container_2 = phaserSprites.add({x: 0, y: 325, name: `container_2`, width: screenSplitX, height: screenSplitY, reference: bmd.cacheBitmapData, visible: false})
        let container_3 = phaserSprites.add({x: screenSplitX, y: 0, name: `container_3`, width: game.world.width - screenSplitX, height: game.world.height, reference: bmd.cacheBitmapData, visible: false})
        let mask1 = phaserSprites.addBasicMaskToSprite(container_1);

        // animate in
        let squareSize = 80
        let count = 0;
        for(let c = 0; c < Math.ceil(game.world.height/squareSize); c++ ){
          for(let r = 0; r < Math.ceil(game.world.width/squareSize); r++ ){
            let gridSquare = phaserSprites.addFromAtlas({x: c * squareSize, y: r * squareSize, name: `grid${count}`, group: 'grids', width: squareSize, height: squareSize, atlas: 'atlas', filename: 'ui_textbox.png', visible: true})
                gridSquare.anchor.setTo(0.5, 0.5)
                gridSquare.x = gridSquare.x += gridSquare.width/2
                gridSquare.y = gridSquare.y += gridSquare.height/2
                gridSquare.fadeOut = (speed:number) => {
                  this.game.add.tween(gridSquare).to( { height: 0 }, speed, Phaser.Easing.Linear.Out, true, 0, 0, false)
                }
                gridSquare.fadeIn = (speed:number) => {
                  this.game.add.tween(gridSquare).to( { height: squareSize }, speed, Phaser.Easing.Linear.In, true, 0, 0, false)
                }

                count++;
            phaserGroup.add(20, gridSquare)
          }
        }

        // backgrounds
        let bg_clouds = phaserSprites.addTilespriteFromAtlas({ name: 'bg_clouds', group: 'ui_bg', x: container_1.x, y: container_1.y, width: container_1.width, height: container_1.height, atlas: 'atlas', filename: 'bg_clouds.png'});
            bg_clouds.mask = mask1;
            bg_clouds.onUpdate = function () {
                if(phaserMaster.get('currentSelection') === 0){
                  this.tilePosition.x -= 3
                }
            };
        let bg_cityscape = phaserSprites.addTilespriteFromAtlas({ name: 'bg_cityscape', group: 'ui_bg', x: container_2.x, y: container_2.y, width: container_2.width, height: container_2.height, atlas: 'atlas', filename: 'bg_cityscape.png'});
            bg_cityscape.onUpdate = function () {
                if(phaserMaster.get('currentSelection')  === 1){
                  this.tilePosition.x -= 0.25
                }
            };
        let bg_cityscape_1 = phaserSprites.addTilespriteFromAtlas({ name: 'bg_cityscape_1', group: 'ui_bg', x: container_2.x, y: container_2.y + 50, width: container_2.width, height: container_2.height, atlas: 'atlas', filename: 'bg_cityscape_1.png'});
            bg_cityscape_1.onUpdate = function () {
                if(phaserMaster.get('currentSelection')  === 1){
                  this.tilePosition.x -= 0.5
                }
            };
        let bg_cityscape_2 = phaserSprites.addTilespriteFromAtlas({ name: 'bg_cityscape_2', group: 'ui_bg', x: container_2.x, y: container_2.y + 115, width: container_2.width, height: container_2.height, atlas: 'atlas', filename: 'bg_cityscape_2.png'});
            bg_cityscape_2.onUpdate = function () {
                if(phaserMaster.get('currentSelection')  === 1){
                  this.tilePosition.x -= 1
                }
            };
        let bg_cityscape_3 = phaserSprites.addTilespriteFromAtlas({ name: 'bg_cityscape_3', group: 'ui_bg', x: container_2.x, y: container_2.y + 200, width: container_2.width, height: container_2.height, atlas: 'atlas', filename: 'bg_cityscape_3.png'});
            bg_cityscape_3.onUpdate = function () {
                if(phaserMaster.get('currentSelection')  === 1){
                  this.tilePosition.x -= 2
                }
            };
        let bg_space = phaserSprites.addTilespriteFromAtlas({ name: 'bg_space', group: 'ui_bg', x: container_3.x, y: container_3.y, width: container_3.width, height: container_3.height, atlas: 'atlas', filename: 'bg_space.png'});
            bg_space.onUpdate = function () {
                if(phaserMaster.get('currentSelection')  === 2){
                  this.tilePosition.y += 2
                }
                else{
                  this.tilePosition.y += 0.1
                }
            };

        let pointer = phaserSprites.addFromAtlas({ name: 'pointer', group: 'ui', atlas: 'atlas', filename: 'ui_pointer.png'});
            pointer.anchor.setTo(0.5, 0.5)
            pointer.hide = function(){
              this.visible = false
            }
            pointer.show = function(){
              this.visible = true
            }
            pointer.updateLocation = function(val:number){
              phaserMaster.forceLet('currentSelection', val)
              let {x, y} = phaserSprites.get(`textbox${val}`)
              this.x = x - 90
              this.y = y
            }


        let downarrow = phaserSprites.addFromAtlas({ name: 'downarrow', group: 'ui', atlas: 'atlas', filename: 'ui_downarrow.png', visible: false});
            downarrow.anchor.setTo(0.5, 0.5)
            downarrow.hide = function(){
              this.visible = false
            }
            downarrow.show = function(){
              this.visible = true
            }
            downarrow.updateLocation = function(x:number, y:number){
              this.x = x
              this.y = y
            }

        // placards
        let textbox0 = phaserSprites.addFromAtlas({ name: 'textbox0', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_textbox.png', alpha: 1});
            textbox0.anchor.setTo(0.5, 0.5)
            phaserSprites.centerOnPoint('textbox0', container_1.width/2 + textbox0.width/2, container_1.y + 40);
        let text0 = phaserTexts.add({name: 'text0', group: 'ui_text', x:textbox0.x, y: textbox0.y,  font: 'gem', size: 12, default: `SELECT PILOT`})
            text0.anchor.setTo(0.5, 0.5)

        let textbox1 = phaserSprites.addFromAtlas({ name: 'textbox1', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_textbox.png', alpha: 1});
            textbox1.anchor.setTo(0.5, 0.5)
            phaserSprites.centerOnPoint('textbox1', container_2.width/2 + textbox1.width/2, container_2.y + 50);
        let text1 = phaserTexts.add({name: 'text1', group: 'ui_text', x:textbox1.x, y: textbox1.y,  font: 'gem', size: 12, default: `LOADOUT`})
            text1.anchor.setTo(0.5, 0.5)

        let textbox2 = phaserSprites.addFromAtlas({ name: 'textbox2', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_textbox.png', alpha: 1});
            textbox2.anchor.setTo(0.5, 0.5)
            phaserSprites.centerOnPoint('textbox2', container_3.x + container_3.width/2 + textbox2.width/2, container_3.y + 40);
        let text2 = phaserTexts.add({name: 'text2', group: 'ui_text', x:textbox2.x, y: textbox2.y,  font: 'gem', size: 12, default: `START`})
            text2.anchor.setTo(0.5, 0.5)

        let pilotDescriptionBox = phaserSprites.addFromAtlas({ name: 'pilotDescriptionBox', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_descriptionbox.png', alpha: 1});
            pilotDescriptionBox.anchor.setTo(0.5, 0.5)
            phaserSprites.centerOnPoint('pilotDescriptionBox', container_1.width/2 + pilotDescriptionBox.width/2, container_1.y + 295);
        let padding = 20;
        let pilotDescriptionText = phaserTexts.add({name: 'pilotDescriptionText', group: 'ui_text', x:pilotDescriptionBox.x - pilotDescriptionBox.width/2 + padding, y: pilotDescriptionBox.y - pilotDescriptionBox.height/2,  font: 'gem', size: 14, default: ``})
            pilotDescriptionText.maxWidth = pilotDescriptionBox.width - padding*2
            pilotDescriptionText.updateThisText = function(val:number){
              this.setText(`
NAME:               ${profilePictures[val].name}

FIRING RATE:        ${profilePictures[val].firerate}
SUBWEAPON RECHARGE: ${profilePictures[val].subweaponRecharge}
HEALTH:             ${profilePictures[val].health}
MOVEMENT:           ${profilePictures[val].movement}
              `)
            }
        phaserGroup.addMany(18, [textbox0, textbox1, textbox2, pilotDescriptionBox])
        phaserGroup.addMany(19, [text0, text1, text2, pilotDescriptionText])

        // profiles
        let profilePictures = pilotData.pilots;
        for(let i = 0; i < profilePictures.length; i++){
          let profile = phaserSprites.addFromAtlas({ name: `profile${i}`, group: 'ui_profiles', y: container_1.y + 110, atlas: 'atlas', filename: `${profilePictures[i].image}`, alpha: 0});
              profile.anchor.setTo(0.5, 0.5)
              let gap = profile.width/2*(profilePictures.length-1)
              profile.x = (container_1.x + (i*profile.width) + container_1.width/2) - gap
              profile.alpha = 1
          phaserGroup.add(18, profile)
        }
        let profileSelector = phaserSprites.addFromAtlas({ name: `profileSelector`, group: 'ui_profiles', atlas: 'atlas', filename: 'ui_pictureframe.png', alpha: 0});
            profileSelector.anchor.setTo(0.5, 0.5)
            profileSelector.updateLocation = function(val:number){
              phaserMaster.forceLet('pilotSelection', val)
              phaserSprites.getGroup('ui_profiles').map(obj => {
                obj.alpha = 0.85
              })
              let profile =  phaserSprites.get(`profile${val}`);
                  profile.alpha = 1
              let {x, y} = profile
              this.x = x
              this.y = y
              downarrow.updateLocation(x,y - profile.height/2 - 8)
            }
            profileSelector.inc = function(){
              pilotSelection += 1
              if(pilotSelection > profilePictures.length - 1){
                pilotSelection = 0
              }
              updateProfileSelection(pilotSelection)
            }
            profileSelector.dec = function(){
              pilotSelection -= 1
              if(pilotSelection < 0){
                pilotSelection = profilePictures.length - 1
              }
              updateProfileSelection(pilotSelection)
            }
        phaserGroup.add(19, profileSelector)

        // loadout
        let i;
        let primaryWeaponList = [];
        let secondaryWeaponList = [];
        let perkList = []

        i = 0
        for (let key of Object.keys(weaponData.primaryWeapons)) {
          let boxPadding = 5;
          let item = weaponData.primaryWeapons[key]
          let box = phaserSprites.addFromAtlas({ name: `box_pw_${i}`, group: 'ui_loadout', y: container_2.y + 90, atlas: 'atlas', filename: `ui_box_unselected.png`, alpha: 0});
              box.anchor.setTo(0.5, 0.5)
          let gap = (box.width + boxPadding)/2 *(returnSizeOfObject(weaponData.primaryWeapons)-1)
          box.x = (container_2.x + (i*box.width) + container_2.width/2) - gap + (i * boxPadding)
          box.alpha = 1

          let sbox = phaserSprites.addFromAtlas({ name: `sbox_pw_${i}`, group: 'ui_box_selected', y: container_2.y + 90, atlas: 'atlas', filename: `ui_box_selected.png`, alpha: 0});
              sbox.anchor.setTo(0.5, 0.5)
          sbox.x = (container_2.x + (i*sbox.width) + container_2.width/2) - gap + (i * boxPadding)
          sbox.alpha = 0

          let icon = phaserSprites.addFromAtlas({ name: `icon_pw_${i}`, group: 'ui_loadout', y: container_2.y + 90, atlas: 'atlas_weapons', filename: `${item.spriteIcon}`, alpha: 1});
              icon.anchor.setTo(0.5, 0.5)
              icon.x = (container_2.x + (i*sbox.width) + container_2.width/2) - gap + (i * boxPadding)

          primaryWeaponList.push(item)
          i++;
          phaserGroup.addMany(18, [box, sbox])
          phaserGroup.add(19, icon)
        }

        i = 0;
        for (let key of Object.keys(weaponData.secondaryWeapons)) {
          let boxPadding = 5;
          let item = weaponData.secondaryWeapons[key]
          let box = phaserSprites.addFromAtlas({ name: `box_sw_${i}`, group: 'ui_loadout', y: container_2.y + 140, atlas: 'atlas', filename: `ui_box_unselected.png`, alpha: 0});
              box.anchor.setTo(0.5, 0.5)
          let gap = (box.width + boxPadding)/2 *(returnSizeOfObject(weaponData.secondaryWeapons)-1)
          box.x = (container_2.x + (i*box.width) + container_2.width/2) - gap + (i * boxPadding)
          box.alpha = 1

          let sbox = phaserSprites.addFromAtlas({ name: `sbox_sw_${i}`, group: 'ui_box_selected', y: container_2.y + 140, atlas: 'atlas', filename: `ui_box_selected.png`, alpha: 0});
              sbox.anchor.setTo(0.5, 0.5)
          sbox.x = (container_2.x + (i*sbox.width) + container_2.width/2) - gap + (i * boxPadding)
          sbox.alpha = 0

          let icon = phaserSprites.addFromAtlas({ name: `icon_sw_${i}`, group: 'ui_loadout', y: container_2.y + 140, atlas: 'atlas_weapons', filename: `${item.spriteIcon}`, alpha: 1});
              icon.anchor.setTo(0.5, 0.5)
              icon.x = (container_2.x + (i*sbox.width) + container_2.width/2) - gap + (i * boxPadding)

          secondaryWeaponList.push(item)
          i++;
          phaserGroup.addMany(18, [box, sbox])
          phaserGroup.add(19, icon)
        }

        i = 0
        for (let key of Object.keys(weaponData.perks)) {
          let boxPadding = 5;
          let item = weaponData.perks[key]
          let box = phaserSprites.addFromAtlas({ name: `box_sp_${i}`, group: 'ui_loadout', y: container_2.y + 190, atlas: 'atlas', filename: `ui_box_unselected.png`, alpha: 0});
              box.anchor.setTo(0.5, 0.5)
          let gap = (box.width + boxPadding)/2 *(returnSizeOfObject(weaponData.perks)-1)
          box.x = (container_2.x + (i*box.width) + container_2.width/2) - gap + (i * boxPadding)
          box.alpha = 1

          let sbox = phaserSprites.addFromAtlas({ name: `sbox_sp_${i}`, group: 'ui_box_selected', y: container_2.y + 190, atlas: 'atlas', filename: `ui_box_selected.png`, alpha: 0});
              sbox.anchor.setTo(0.5, 0.5)
          sbox.x = (container_2.x + (i*sbox.width) + container_2.width/2) - gap + (i * boxPadding)
          sbox.alpha = 0

          let icon = phaserSprites.addFromAtlas({ name: `icon_sp_${i}`, group: 'ui_loadout', y: container_2.y + 190, atlas: 'atlas_weapons', filename: `${item.spriteIcon}`, alpha: 1});
              icon.anchor.setTo(0.5, 0.5)
              icon.x = (container_2.x + (i*sbox.width) + container_2.width/2) - gap + (i * boxPadding)

          perkList.push(item)
          i++;
          phaserGroup.addMany(18, [box, sbox])
          phaserGroup.add(19, icon)
        }

        phaserMaster.let('primaryWeaponList', primaryWeaponList)
        phaserMaster.let('secondaryWeaponList', secondaryWeaponList)
        phaserMaster.let('perkList', perkList)

        let loadoutCatagorySelector = phaserSprites.addFromAtlas({ name: `loadoutCatagorySelector`, group: 'ui_loadout', atlas: 'atlas', filename: 'ui_pointer.png', visible: false, alpha: 0});
            loadoutCatagorySelector.anchor.setTo(0.5, 0.5)
            loadoutCatagorySelector.show = function(){
              this.visible = true;
            }
            loadoutCatagorySelector.hide = function(){
              this.visible = false;
            }
            loadoutCatagorySelector.updateLocation = function(val:number){
              let {primaryWeaponSelection, subWeaponSelection, perkSelection} = phaserMaster.getAll()

              let box;
              if(val === 0){
                box =  phaserSprites.get(`box_pw_${primaryWeaponSelection}`);
                let {x, y} = box
                downarrow.updateLocation(x,y - 30)
              }
              if(val === 1){
                box =  phaserSprites.get(`box_sw_${subWeaponSelection}`);
                let {x, y} = box
                downarrow.updateLocation(x,y - 30)
              }
              if(val === 2){
                box =  phaserSprites.get(`box_sp_${perkSelection}`);
                let {x, y} = box
                downarrow.updateLocation(x,y - 30)
              }
              let {x, y} = box
              this.x = 40
              this.y = y
              this.visible
            }

        let loadoutDescription = phaserSprites.addFromAtlas({ name: 'loadoutDescription', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_descriptionbox_small.png', visible: false});
            loadoutDescription.anchor.setTo(0.5, 0.5)
            phaserSprites.centerOnPoint('loadoutDescription', container_2.width/2 + loadoutDescription.width/2, container_2.y + 310);
        let loadoutDescriptionText = phaserTexts.add({name: 'loadoutDescriptionText', group: 'ui_text', x:loadoutDescription.x, y: loadoutDescription.y,  font: 'gem', size: 14, default: ``})
            loadoutDescriptionText.anchor.setTo(0.5, 0.5)
            loadoutDescriptionText.maxWidth = loadoutDescription.width - padding*2
            phaserGroup.add(18, loadoutDescription)
            phaserGroup.add(19, loadoutDescriptionText)

        // create ship preview
        let ship = phaserSprites.addFromAtlas({name: 'ship', group: 'ship_preview', atlas: 'atlas_main',  filename: 'ship_body.png', visible: true})
            ship.anchor.setTo(0.5, 0.5)
        phaserSprites.centerOnPoint('ship', container_3.x + container_3.width/2 + ship.width/2, container_3.height - 100 );


        let shipExhaust = phaserSprites.addFromAtlas({name: 'exhaust', group: 'ship_preview', atlas: 'atlas_main',  filename: 'exhaust_red_1.png', visible: true})
            shipExhaust.animations.add('exhaust_animation', Phaser.Animation.generateFrameNames('exhaust_red_', 1, 8, '.png'), 1, true)
            shipExhaust.animations.play('exhaust_animation', 30, true)
            shipExhaust.anchor.setTo(0.5, 0.5)
            shipExhaust.onUpdate = function(){
              let {x, y} = ship;
              this.visible = true
              this.x = x

              if(phaserMaster.get('currentSelection')  === 2){
                this.y = y + 40;
                this.scale.setTo(1, 1)
              }
              else{
                this.y = y + 25;
                this.scale.setTo(1, 0.25)
              }

            }

        //phaserGroup.addMany(0, [container_1])
        phaserGroup.addMany(1, [bg_space])
        // loadout preview is on layer 2
        phaserGroup.addMany(5, [ship, shipExhaust])

        phaserGroup.addMany(6, [bg_clouds, bg_cityscape, bg_cityscape_1, bg_cityscape_2, bg_cityscape_3])
        phaserGroup.addMany(10, [verticleFrame, dividerFrame1])
        phaserGroup.addMany(15, [pointer, downarrow])
      }
      /******************/

      /******************/
      function preloadComplete(){
          let game = phaserMaster.game();
          let {pointer} = phaserSprites.getAll('OBJECT');
          let {currentSelection} = phaserMaster.getAll();

          // setDefault
          pointer.updateLocation(currentSelection)
          updateWeaponSelected()
          updateProfileSelection(0)

          overlayControls('FADEOUT', () => {
            // change state
            phaserMaster.changeState('MAINMENU');
          })

      }
      /******************/

      /******************/
      function overlayControls(transition:string, callback:any = ()=>{}){
        let delay = 500;
        let speed = 500;
        let tileDelay = 10

        setTimeout(() => {
          if(transition === 'FADEOUT'){
            phaserSprites.getGroup('grids').map( (obj, index) => {
              setTimeout(() => {
                  obj.fadeOut(speed)
              }, tileDelay * index)
            })
            setTimeout(() => {
              callback()
            }, phaserSprites.getGroup('grids').length * tileDelay + speed)
          }

          if(transition === 'FADEIN'){
            phaserSprites.getGroup('grids').map( (obj, index) => {
              setTimeout(() => {
                  obj.fadeIn(speed)
              }, tileDelay * index)
            })
            setTimeout(() => {
              callback()
            }, phaserSprites.getGroup('grids').length * tileDelay + speed)
          }
        }, delay)

      }
      /******************/

      /******************/
      function playLoadoutPreview(type:string){
        let game = phaserMaster.game();
        let {primaryWeaponList, primaryWeaponSelection, loadoutSelection, secondaryWeaponList, subWeaponSelection, perkSelection} = phaserMaster.getAll();
        let {ship} = phaserSprites.getAll('OBJECT')
        
        // PREVIEW MAIN WEAPONS
        if(type === 'PRIMARY'){
          if(primaryWeaponList[primaryWeaponSelection].reference === 'BULLET'){
            weaponManager.createBullet({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x - 25, offset: 0, y: ship.y, spread: 0, layer: 3})
            weaponManager.createBullet({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x + 25, offset: 0, y: ship.y, spread: 0, layer: 3})
          }
          if(primaryWeaponList[primaryWeaponSelection].reference === 'MISSLES'){
            weaponManager.createMissle({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x - 25, offset: 0, y: ship.y - ship.height/2, spread: -0.25, layer: 3})
            weaponManager.createMissle({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x + 25, offset: 0, y: ship.y - ship.height/2, spread: 0.25, layer: 3})
          }
          if(primaryWeaponList[primaryWeaponSelection].reference === 'LASER'){
            weaponManager.createLaser({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x - 25, offset: 0, y: ship.y - ship.height/2, spread: 0, layer: 3})
            weaponManager.createLaser({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x + 25, offset: 0, y: ship.y - ship.height/2, spread: 0, layer: 3})
          }
        }

        // PREVIEW SUBWEAPONS
        if(type === 'SECONDARY'){
          if(secondaryWeaponList[subWeaponSelection].reference === 'CLUSTERBOMB'){
            weaponManager.createClusterbomb({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x, y: ship.y, layer: 3})
          }
          if(secondaryWeaponList[subWeaponSelection].reference === 'TRIPLEBOMB'){
            weaponManager.createTriplebomb({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x, y: ship.y, layer: 3})
            setTimeout(() => {
              weaponManager.createTriplebomb({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x + game.rnd.integerInRange(0, 20), y: ship.y, layer: 3, spread: game.rnd.integerInRange(0, 2)})
            }, 100)
            setTimeout(() => {
              weaponManager.createTriplebomb({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x - game.rnd.integerInRange(0, 20), y: ship.y, layer: 3, spread: game.rnd.integerInRange(-2, 0)})
            }, 200)
          }
          if(secondaryWeaponList[subWeaponSelection].reference === 'TURRET'){
            weaponManager.createTurret({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x, y: ship.y + 50, layer: 4})
          }
          if(secondaryWeaponList[subWeaponSelection].reference === 'BLASTRADIUS'){
            weaponManager.createBlastradius({name: `B${game.rnd.integer()}`, group: 'ship_wpn_preview', x: ship.x, y: ship.y, layer: 2})
          }
        }

      }
      /******************/

      /******************/
      function updateWeaponSelected(){
        let {primaryWeaponSelection, subWeaponSelection, perkSelection} = phaserMaster.getAll()

        phaserSprites.getGroup('ui_box_selected').map(obj => {
          obj.alpha = 0
        })

        phaserSprites.get(`sbox_pw_${primaryWeaponSelection}`).alpha = 1
        phaserSprites.get(`sbox_sw_${subWeaponSelection}`).alpha = 1
        phaserSprites.get(`sbox_sp_${perkSelection}`).alpha = 1
      }
      /******************/

      /******************/
      function updateProfileSelection(val:number) {
        let {profileSelector, loadoutCatagorySelector} = phaserSprites.getAll('OBJECT');
        let {pilotDescriptionText} = phaserTexts.getAll('OBJECT')
        profileSelector.updateLocation(val)
        pilotDescriptionText.updateThisText(val)
      }
      /******************/

      /******************/
      function updateLoadoutCatagory(val:number){
        let {loadoutSelection} = phaserMaster.getAll()
        let {downarrow, loadoutCatagorySelector} = phaserSprites.getAll('OBJECT')

        loadoutSelection += val
        if(val > 0){
          if(loadoutSelection > 2){
            loadoutSelection = 2
          }
        }

        if(val < 0){
          if(loadoutSelection < 0){
            loadoutSelection = 0
          }
        }

        phaserMaster.forceLet('loadoutSelection', loadoutSelection)
        loadoutItemSelector(null)
        loadoutCatagorySelector.updateLocation(loadoutSelection)
      }
      /******************/

      /******************/
      function loadoutItemSelector(val:number){
        let {weaponData, loadoutSelection, primaryWeaponSelection, subWeaponSelection, perkSelection, primaryWeaponList, secondaryWeaponList, perkList} = phaserMaster.getAll()
        let {downarrow, loadoutCatagorySelector} = phaserSprites.getAll('OBJECT')
        let {loadoutDescriptionText} = phaserTexts.getAll('OBJECT');

        if(loadoutSelection === 0){
          primaryWeaponSelection += val
          if(val > 0){
            if(primaryWeaponSelection >= returnSizeOfObject(weaponData.primaryWeapons)){
               primaryWeaponSelection = 0
            }
            phaserMaster.forceLet('primaryWeaponSelection', primaryWeaponSelection)
          }
          if(val < 0){
            if(primaryWeaponSelection < 0){
               primaryWeaponSelection = returnSizeOfObject(weaponData.primaryWeapons) - 1
            }
            phaserMaster.forceLet('primaryWeaponSelection', primaryWeaponSelection)
          }

          loadoutDescriptionText.setText(`${primaryWeaponList[primaryWeaponSelection].name}: ${primaryWeaponList[primaryWeaponSelection].description}` )
        }

        if(loadoutSelection === 1){
          subWeaponSelection += val
          if(val > 0){
            if(subWeaponSelection >= returnSizeOfObject(weaponData.secondaryWeapons)){
               subWeaponSelection = 0
            }
            phaserMaster.forceLet('subWeaponSelection', subWeaponSelection)
          }
          if(val < 0){
            if(subWeaponSelection < 0){
               subWeaponSelection = returnSizeOfObject(weaponData.secondaryWeapons) - 1
            }
            phaserMaster.forceLet('subWeaponSelection', subWeaponSelection)
          }
          loadoutDescriptionText.setText(`${secondaryWeaponList[subWeaponSelection].name}: ${secondaryWeaponList[subWeaponSelection].description}` )
        }

        if(loadoutSelection === 2){
          perkSelection += val
          if(val > 0){
            if(perkSelection >= returnSizeOfObject(weaponData.perks)){
               perkSelection = 0
            }
            phaserMaster.forceLet('perkSelection', perkSelection)
          }
          if(val < 0){
            if(perkSelection < 0){
               perkSelection = returnSizeOfObject(weaponData.perks) - 1
            }
            phaserMaster.forceLet('perkSelection', perkSelection)
          }
          loadoutDescriptionText.setText(`${perkList[perkSelection].name}: ${perkList[perkSelection].description}` )
        }

        let box;
        if(loadoutSelection === 0){
          box =  phaserSprites.get(`box_pw_${primaryWeaponSelection}`);
          let {x, y} = box
          downarrow.updateLocation(x,y - 30)
        }
        if(loadoutSelection === 1){
          box =  phaserSprites.get(`box_sw_${subWeaponSelection}`);
          let {x, y} = box
          downarrow.updateLocation(x,y - 30)
        }
        if(loadoutSelection === 2){
          box =  phaserSprites.get(`box_sp_${perkSelection}`);
          let {x, y} = box
          downarrow.updateLocation(x,y - 30)
        }

        updateWeaponSelected();
        loadoutCatagorySelector.updateLocation(loadoutSelection)
      }
      /******************/

      /******************/
      function returnSizeOfObject(obj:any) {
        var size = 0
        for (let key of Object.keys(obj)) {size++}
        return size;
      }
      /******************/

      /******************/
      function update() {
        let game = phaserMaster.game();
        let {currentSelection, pilotSelection, loadoutSelection, primaryWeaponList, primaryWeaponSelection, secondaryWeaponList, subWeaponSelection} = phaserMaster.getAll();
        let {profileSelector, loadoutCatagorySelector, pointer, downarrow, loadoutDescription} = phaserSprites.getAll('OBJECT');
        let {loadoutDescriptionText} = phaserTexts.getAll('OBJECT')

        phaserSprites.getManyGroups(['ui_bg', 'ship_preview', 'ship_wpn_preview']).map(obj => {
          obj.onUpdate()
        })


        if(phaserControls.checkWithDelay({isActive: true, key: 'BACK', delay: 250})){
          if(currentSelection === 2){
            pointer.updateLocation(0)
          }
        }

        if(phaserControls.checkWithDelay({isActive: true, key: 'START', delay: 250})){
          if(currentSelection !== 2){
            phaserMaster.forceLet('loadoutSelection', 0)
            pointer.show()
            downarrow.hide();
            loadoutDescription.hide()
            loadoutDescriptionText.hide()
            loadoutCatagorySelector.hide();
            phaserMaster.changeState('MAINMENU');
            pointer.updateLocation(2)
          }

          if(currentSelection === 2){
            pointer.hide()
            phaserMaster.forceLet('currentSelection', null)
            overlayControls('FADEIN', () => {
              startGame();
            })
          }
        }

        // MAIN MENU CONTROLS
        if(phaserMaster.checkState('MAINMENU')){

          if(phaserControls.checkWithDelay({isActive: true, key: 'UP', delay: 250})){
            if(currentSelection !== 2){
              pointer.updateLocation(0)
            }
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'DOWN', delay: 250})){
            if(currentSelection === 1){
              pointer.hide()
              downarrow.show();
              loadoutDescription.show()
              loadoutDescriptionText.show()
              loadoutCatagorySelector.show();
              loadoutCatagorySelector.updateLocation(loadoutSelection)
              loadoutItemSelector(loadoutSelection)
              phaserMaster.changeState('LOADOUTSELECT');
            }
            if(currentSelection !== 2){
              pointer.updateLocation(1)
            }
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'RIGHT', delay: 250})){
            if(currentSelection === 0){
              profileSelector.inc()
            }
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'LEFT', delay: 250})){
            if(currentSelection === 0){
              profileSelector.dec()
            }
          }


          if(phaserControls.checkWithDelay({isActive: true, key: 'A', delay: 250})){
            if(currentSelection === 2){
              pointer.hide()
              phaserMaster.forceLet('currentSelection', null)
              overlayControls('FADEIN')
            }
          }
        }

        // PILOT SELECT
        if(phaserMaster.checkState('PILOTSELECT')){
          if(phaserControls.checkWithDelay({isActive: true, key: 'LEFT', delay: 250})){
            profileSelector.dec()
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'RIGHT', delay: 250})){
            profileSelector.inc()
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'A', delay: 250})){
            downarrow.hide();
            pointer.show()
            phaserMaster.changeState('MAINMENU');
          }
        }

        // LOADOUT SELECT
        if(phaserMaster.checkState('LOADOUTSELECT')){


          if(phaserControls.checkWithDelay({isActive: true, key: 'A', delay: primaryWeaponList[primaryWeaponSelection].cooldown})){
            playLoadoutPreview('PRIMARY')
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'B', delay: secondaryWeaponList[subWeaponSelection].cooldown})){
            playLoadoutPreview('SECONDARY')
          }

          if(phaserControls.checkWithDelay({isActive: true, key: 'DOWN', delay: 250})){
            updateLoadoutCatagory(1)
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'UP', delay: 250})){
            if(loadoutSelection === 0){
              phaserMaster.forceLet('loadoutSelection', 0)
              pointer.show()
              downarrow.hide();
              loadoutDescription.hide()
              loadoutDescriptionText.hide()
              loadoutCatagorySelector.hide();
              phaserMaster.changeState('MAINMENU');
            }
            else{
              updateLoadoutCatagory(-1)
            }
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'RIGHT', delay: 250})){
            loadoutItemSelector(1)
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'LEFT', delay: 250})){
            loadoutItemSelector(-1)
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'BACK', delay: 250})){
            phaserMaster.forceLet('loadoutSelection', 0)
            pointer.show()
            downarrow.hide();
            loadoutDescription.hide()
            loadoutDescriptionText.hide()
            loadoutCatagorySelector.hide();
            phaserMaster.changeState('MAINMENU');
          }

        }

      }
      /******************/

      /******************/
      function startGame(){
        let {primaryWeaponList, primaryWeaponSelection, loadoutSelection, secondaryWeaponList, subWeaponSelection, perkList, perkSelection, pilotSelection} = phaserMaster.getAll();

        saveData('pilot', pilotSelection)
        saveData('primaryWeapon', primaryWeaponList[primaryWeaponSelection].reference)
        saveData('secondaryWeapon', secondaryWeaponList[subWeaponSelection].reference)
        saveData('perk', perkList[perkSelection].reference)
        updateStore();
        parent.startGame();

      }
      /******************/

      /******************/
      function end(){
        parent.test()
      }
      /******************/

      /******************/
      /*  DO NOT TOUCH */
      parent.game = this;                 // make game accessible to parent element
      this.game = phaserMaster.game();    // make accessible to class functions
      /******************/
    }
    /******************/

    /******************/
    public destroy(){
      this.game.destroy();
    }
    /******************/

}

let __phaser = new PhaserGameObject();