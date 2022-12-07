import { MaterialModule } from '../../../material.module';
import { CreateTokenFormDialogComponent } from './create-token-form-dialog.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [CreateTokenFormDialogComponent],
  imports: [CommonModule, FormsModule, MaterialModule],
  exports: [CreateTokenFormDialogComponent],
})
export class CreateTokenFormDialogModule {}
