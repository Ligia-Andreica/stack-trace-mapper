## Stack trace mapper

Stack trace mapper extracts the source maps from (React Native) production build apks and translates uglified/minified stack traces to local source code files.

Run `yarn install` to download dependencies

Run `yarn usage` to view help

Run `yarn analyze --apk <path_to_apk> --line <stack_trace_line_error> --column <stack_trace_column_error> --remote <remote_project_directory> --local <local_project_directory> --open <should_open_file_in_idea>` to map source maps to source files

Options:
 - apk:
    - required
    - absolute path to apk on disk
 - line:
    - required
    - stack trace error line
 - column:
    - required
    - stack trace column line
 - remote:
    - optional
    - if the apk was build remotely via CI/CD, original source file path needs to be cleaned
    - default value: "/home/circleci/project/"
 - local:
    - optional
    - local path to the project source tree; it will be appended to the original source file path
    - default value: "../"
 - open:
    - optional
    - if set to true, the local source file will be open in Intellij Idea
