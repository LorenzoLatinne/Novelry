using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovelryWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixStatusTypeUserBook : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Stats",
                table: "UserBooks",
                newName: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                table: "UserBooks",
                newName: "Stats");
        }
    }
}
