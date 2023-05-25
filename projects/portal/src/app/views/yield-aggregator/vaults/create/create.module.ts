import { MaterialModule } from '../../../material.module';
import { CreateComponent } from './create.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [CreateComponent],
  imports: [CommonModule, RouterModule, FormsModule, MaterialModule],
  exports: [CreateComponent],
})
export class CreateModule {}
