import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/AuthModule/common/guards/roles.guard';
import { Roles } from 'src/AuthModule/common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('total-topic')
  @HttpCode(HttpStatus.OK)
  async getTotal() {
    return await this.dashboardService.getTotalTopicThisMonth();
  }

  @Get('total-premium')
  @HttpCode(HttpStatus.OK)
  async countUserPremium() {
    return await this.dashboardService.countUserPremium();
  }

  @Get('top-10-anime')
  @HttpCode(HttpStatus.OK)
  async getTop10AllTime() {
    return await this.dashboardService.getTop10AnimeAllTime();
  }

  @Get('income-data')
  @HttpCode(HttpStatus.OK)
  async getReportData(
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return await this.dashboardService.getReportData(year);
  }

  @Get('total-transaction')
  @HttpCode(HttpStatus.OK)
  async totalTransaction() {
    return await this.dashboardService.totalTransactionThisMonth();
  }

  @Get('total-income')
  @HttpCode(HttpStatus.OK)
  async totalIncome() {
    return await this.dashboardService.totalIncomeThisMonth();
  }
}
