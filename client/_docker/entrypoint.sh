#!/bin/bash
cd /client || exit

output_file=".env"
> $output_file
while IFS='=' read -r name value ; do
    if [[ $name == CLUSTER* ]] || [[ $name == PORT_CLIENT ]] || [[ $name == EXTAUTH_LOG* ]]; then
        echo "VITE_$name=$value" >> $output_file
    fi
done < <(env)

serve -s dist -l $PORT_CLIENT