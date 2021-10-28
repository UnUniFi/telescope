import { KeyService } from '../../../models/keys/key.service';
import { CreateOnSubmitEvent } from '../../../views/keys/create/create.component';
import { Component, OnInit } from '@angular/core';
import * as bip39 from 'bip39';
import { KeyApplicationService } from 'projects/main/src/app/models/keys/key.application.service';
import { KeyBackupDialogService } from '../../../models/keys/key-backup-dialog.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css'],
})
export class CreateComponent implements OnInit {
  mnemonic: string;
  privateKey: string;
  saved: boolean = false;

  constructor(
    private readonly keyApplication: KeyApplicationService,
    private readonly key: KeyService,
    private readonly keyBackupDialog: KeyBackupDialogService,
  ) {
    this.mnemonic = '';
    this.privateKey = '';
  }

  ngOnInit(): void { }

  onClickCreateMnemonic() {
    this.mnemonic = bip39.generateMnemonic();
    window.alert('You must memory this mnemonic.');
  }

  async onBlurMnemonic(mnemonic: string) {
    if (!mnemonic) {
      return;
    }
    this.privateKey = await this.key.getPrivateKeyFromMnemonic(mnemonic);
  }

  async onSubmit($event: CreateOnSubmitEvent) {

    this.saved = await this.keyBackupDialog.open(this.mnemonic, $event.privateKey);

    //todo:ダイアログ閉じたら0、ダイアログ外でundefined→保存の有無で制御
    console.log("checked", typeof (this.saved), this.saved)
    if (this.saved === true) {
      await this.keyApplication.create($event.id, $event.type, $event.privateKey);
    }
  }
}
