import { PipesModule } from '../../../pipes/pipes.module';
import { SimplePoolsComponent } from './simple-pools.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [SimplePoolsComponent],
  imports: [CommonModule, RouterModule, PipesModule],
  exports: [SimplePoolsComponent],
})
export class SimplePoolsModule {}
