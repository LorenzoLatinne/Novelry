using Microsoft.EntityFrameworkCore;
using NovelryWebAPI.Data;
using NovelryWebAPI.Data.DefaultData;
using NovelryWebAPI.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var mssqlConnString = builder.Configuration.GetConnectionString("mssqlServer");

builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(mssqlConnString));

builder.Services.AddRepositories();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

await SeedData.LoadData(app);

app.Run();
