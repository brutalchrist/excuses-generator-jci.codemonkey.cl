const { Gio, St, Clutter } = imports.gi;
const ModalDialog = imports.ui.modalDialog;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const AboutDialog = new Lang.Class({
    Name: 'AboutDialog',
    Extends: ModalDialog.ModalDialog,

    _init: function() {
        this.parent({ styleClass: 'extension-dialog' });

        this.setButtons([{
            label: 'OK',
            action: Lang.bind(this, this._onClose),
            key: Clutter.KEY_Escape
        }]);

        let box = new St.BoxLayout({ vertical: true});
        this.contentLayout.add(box);

        let gicon = new Gio.FileIcon({ 
            file: Gio.file_new_for_path(`${Me.path}/images/jci.svg`)
        });
        let icon = new St.Icon({
            gicon: gicon,
            icon_size: 120,
            style_class: 'AboutLogo'
        });
        box.add(icon);

        box.add(new St.Label({
            text: `${Me.metadata.name}`,
            x_align: Clutter.ActorAlign.CENTER,
            style_class: "AboutTitle"
        }));
        box.add(new St.Label({
            text: `${Me.metadata.version}`,
            x_align: Clutter.ActorAlign.CENTER,
            style_class: "AboutVersion"
        }));
        box.add(new St.Label({
            text: "In memoriam of Juan Carlos Inostroza A.K.A. jci.",
            x_align: Clutter.ActorAlign.CENTER,
            style_class: "AboutDescription"
        }));
    },

    _onClose: function() {
        this.close(global.get_current_time());
    },
});

function show() {
    const aboutDialog = new AboutDialog();
    aboutDialog.open(global.get_current_time());
}
