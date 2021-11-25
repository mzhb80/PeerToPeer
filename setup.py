import os
from pathlib import Path
import yaml


def parseYAML(configPath):
    with open(configPath, "r") as stream:
        return yaml.safe_load(stream)


configPaths = next(os.walk("./configs"), (None, None, []))[2]
configPaths = list(filter(lambda f: f != "NodeFiles.yml", configPaths))

for configPath in configPaths:
    config = parseYAML("./configs/" + configPath)
    Path(config['owned_files_dir']).mkdir(parents=True, exist_ok=True)
    Path(config['new_files_dir']).mkdir(parents=True, exist_ok=True)
    for file in config['owned_files']:
        Path(config['owned_files_dir'] + file).touch(exist_ok=True)
        f = open(config['owned_files_dir'] + file, "w")
        f.write("Hello I am " + file +
                "\nLiving in the directories of node " + str(config['node_number']))
        f.close()
