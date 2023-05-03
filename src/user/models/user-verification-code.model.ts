import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  Default,
  BelongsTo,
  AllowNull
} from 'sequelize-typescript';
import { User } from './user.model';
import { UserVerificationCodeUseCaseEnum } from '../user.enum';

@Table({ timestamps: true, tableName: 'UserVerificationCodes' })
export class UserVerificationCode extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Default(UserVerificationCodeUseCaseEnum.PASSWORD_RESET)
  @AllowNull(false)
  @Column({ type: DataType.ENUM(...Object.values(UserVerificationCodeUseCaseEnum)) })
  useCase: UserVerificationCodeUseCaseEnum;

  @AllowNull(false)
  @Column
  code: string;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  expiryDate: Date;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ onDelete: 'CASCADE', onUpdate: 'CASCADE', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  @Column
  createdAt: Date;

  @UpdatedAt
  @Column
  updatedAt: Date;
}
