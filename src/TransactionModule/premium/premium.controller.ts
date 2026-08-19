import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { PremiumService } from './premium.service';
import { CreatePremiumDto } from './dto/create-premium.dto';
import { UpdatePremiumDto } from './dto/update-premium.dto';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/AuthModule/common/guards/roles.guard';
import { Roles } from 'src/AuthModule/common/decorators/roles.decorator';

@Controller('premium')
export class PremiumController {
  constructor(private readonly premiumService: PremiumService) { }

  @Post('post')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createPremiumDto: CreatePremiumDto) {
    return await this.premiumService.createPremium(createPremiumDto);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deletePremium(@Param('id') id: string) {
    return await this.premiumService.deletePremium(id);
  }

  @Get('get/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getPremiumEdit(@Param('id') id: string) {
    return await this.premiumService.getPremiumEdit(id);
  }

  @Get('get-all')
  async getAll() {
    return await this.premiumService.getALl();
  }

  @Get('get-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getPremiumAdmin(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('status') status?: string,
  ) {
    return await this.premiumService.getPremiumAdmin(
      page,
      limit,
      search,
      status,
    );
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updatePremium(
    @Param('id') id: string,
    @Body() updatePremiumDto: UpdatePremiumDto,
  ) {
    return await this.premiumService.updatePremium(id, updatePremiumDto);
  }
}
