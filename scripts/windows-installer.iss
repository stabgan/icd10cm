#define MyAppName "ICD-10-CM Browser"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "ICD-10-CM Browser"
#define MyAppURL "https://github.com/yourusername/icd10cm-browser"
#define MyAppExeName "icd10cm-browser.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
AppId={{EA9BACC0-91E1-4D2F-A25E-C68CA10EABCD}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
OutputDir=out\make
OutputBaseFilename=ICD-10-CM-Browser-Setup
SetupIconFile=build\icons\icon.ico
Compression=lzma
SolidCompression=yes
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "out\icd10cm-browser-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "taskkill"; Parameters: "/f /im {#MyAppExeName}"; RunOnceId: "StopApp"; Flags: runhidden

[Code]
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
  IsInstalled: Boolean;
  MongodbPath: String;
begin
  // Check if MongoDB is installed
  MongodbPath := ExpandConstant('{commonpf}\MongoDB\Server\4.0\bin\mongod.exe');
  IsInstalled := FileExists(MongodbPath);

  if not IsInstalled then
    MongodbPath := ExpandConstant('{commonpf}\MongoDB\Server\5.0\bin\mongod.exe');
    IsInstalled := FileExists(MongodbPath);
  
  if not IsInstalled then
    MongodbPath := ExpandConstant('{commonpf}\MongoDB\Server\6.0\bin\mongod.exe');
    IsInstalled := FileExists(MongodbPath);

  if not IsInstalled then
    MongodbPath := ExpandConstant('{commonpf}\MongoDB\Server\7.0\bin\mongod.exe');
    IsInstalled := FileExists(MongodbPath);

  if not IsInstalled then
    MongodbPath := ExpandConstant('{commonpf}\MongoDB\Server\8.0\bin\mongod.exe');
    IsInstalled := FileExists(MongodbPath);

  if not IsInstalled then
  begin
    if MsgBox('MongoDB is required but could not be found. Would you like to download and install it now?',
       mbConfirmation, MB_YESNO) = IDYES then
    begin
      ShellExec('open', 'https://www.mongodb.com/try/download/community', '', '', SW_SHOW, ewNoWait, ResultCode);
      MsgBox('After installing MongoDB, please run this installer again.', mbInformation, MB_OK);
      Result := False;
    end
    else
      Result := True; // User chose to continue without MongoDB
  end
  else
    Result := True;
end; 