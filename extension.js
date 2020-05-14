'use strict';

const { Gio, GObject, St, Soup, Gtk, Gdk, Clutter } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Config = imports.misc.config;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const AboutDialog = Me.imports.about;
const Utils = Me.imports.utils;

// For compatibility checks, as described above
const SHELL_MINOR = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

const URL = 'https://jci.sgonzalez.dev/excuses';

let _settings;
let _httpSession;

var ExcusesGenerator = class ExcusesGenerator extends PanelMenu.Button {

    _init() {
        super._init(St.Side.TOP, `${Me.metadata.name} Indicator`, false);

        _settings = Utils.getSettings();
        _settings.set_boolean('easteregg', false);
        _settings.connect('changed::easteregg', Lang.bind(this, this._getExcuse));

        const iconPath = `${Me.path}/images/jci.svg`;
        const icon = new St.Icon({
            gicon: Gio.icon_new_for_string(iconPath),
            style_class: 'system-status-icon'
        });

        this.add_actor(icon);

        this._getExcuse();
    }

    _refreshUI(labelProperties = {}) {
        if (this.mainBox != null)
            this.mainBox.destroy();

        this.mainBox = new St.BoxLayout({style_class: 'ExcusesMainBox'});
        this.mainBox.set_vertical(true);

        const title = new St.Label({
            text: 'Diablos! Tengo que...',
            style_class: 'ExcusesTitle'
        });

        this.mainBox.add(title);
        this.menu.box.add(this.mainBox);

        const excuseLabel = new St.Label({
            style_class: `ExcusesExcuse ${labelProperties.textClass}`,
            text: labelProperties.text,
            reactive: true,
        });
        
        excuseLabel.clutter_text.line_wrap = true;

        this.mainBox.add(excuseLabel);

        this.mainBox.add(new PopupMenu.PopupSeparatorMenuItem());

        const newExcuseButton = new St.Button({
            label: 'New excuse',
            style_class: 'popup-menu-item',
            track_hover: true,
            reactive: true,
            toggle_mode: true
        });

        this.mainBox.add(newExcuseButton);

        const aboutButton = new St.Button({
            label: 'About',
            style_class: 'popup-menu-item',
            track_hover: true,
            reactive: true,
            toggle_mode: true
        });

        this.mainBox.add(aboutButton);

        excuseLabel.connect(
            'button-press-event',
            this._clickHandler.bind(this, labelProperties.text)
        );

        newExcuseButton.connect('button-press-event', this._getExcuse.bind(this));
        aboutButton.connect('button-press-event', this._showAbout.bind(this));
    }

    _clickHandler(text) {
        Gtk.Clipboard
            .get_default(Gdk.Display.get_default())
            .set_text(text, -1);

        Main.notify('Excuses generator', 'Excuse copied to clipboard');
    }

    _showAbout() {
        AboutDialog.show();
    }

    _getExcuse() {
        const params = {};
        
        if (_settings.get_boolean('easteregg')) {
            params.v = 'easter';
        }
        const message = Soup.form_request_new_from_hash('GET', URL, params);

        _httpSession = new Soup.Session();

        _httpSession.queue_message(
            message,
            Lang.bind(this, function (_httpSession, message) {
                const labelProperties = {
                    text: 'solucionar este bug!',
                    textClass: 'ExcusesExcuse__Error'
                }

                if (message.status_code === 200) {
                    const json = JSON.parse(message.response_body.data);

                    labelProperties.text = json.excuse;
                    labelProperties.textClass = '';
                }

                this._refreshUI(labelProperties);
            })
        );
    }

    stop() {
        if (_httpSession !== undefined)
            _httpSession.abort();
        _httpSession = undefined;

        this.menu.removeAll();
    }
}

// Compatibility with gnome-shell >= 3.32
if (SHELL_MINOR > 30) {
    ExcusesGenerator = GObject.registerClass(
        {GTypeName: 'ExcusesGenerator'},
        ExcusesGenerator
    );
}

var excusesGenerator = null;

function init() {
    log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
}

function enable() {
    log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);

    excusesGenerator = new ExcusesGenerator();

    Main.panel.addToStatusArea(`${Me.metadata.name}`, excusesGenerator);
}

function disable() {
    log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);

    if (excusesGenerator !== null) {
        excusesGenerator.stop();
        excusesGenerator.destroy();
        excusesGenerator = null;
    }
}
