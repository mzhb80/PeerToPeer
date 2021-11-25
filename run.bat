for %%a in (./configs/*) do if not %%a == NodeFiles.yml start "" npm start ./configs/%%a ./configs/NodeFiles.yml
