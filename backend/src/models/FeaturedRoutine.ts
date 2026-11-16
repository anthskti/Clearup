import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db";

interface FeaturedRoutineAttributes {
  id: number;
  routineId: number;
  pinnedBy: string;
  position: number;
  isActive: boolean;
}

interface FeaturedRoutineCreationAttributes
  extends Optional<FeaturedRoutineAttributes, "id"> {}

class FeaturedRoutine
  extends Model<FeaturedRoutineAttributes, FeaturedRoutineCreationAttributes>
  implements FeaturedRoutineAttributes
{
  declare id: number;
  declare routineId: number;
  declare pinnedBy: string;
  declare position: number;
  declare isActive: boolean;
}

FeaturedRoutine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    routineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    pinnedBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "featured_routines",
    timestamps: true,
  },
);

export default FeaturedRoutine;
