from __future__ import annotations
import random
N,E,S,W = 1,2,4,8
DIRS = [(N, -1, 0, S), (E, 0, 1, W), (S, 1, 0, N), (W, 0, -1, E)]
def rotate(mask): return ((mask << 1) & 0b1110) | ((mask & W) >> 3)
def make_maze(size=5):
    r=random.Random(); grid=[[0 for _ in range(size)] for _ in range(size)]
    # Carve a randomized spanning tree so every cell is reachable in the hidden solution.
    seen={(0,0)}; stack=[(0,0)]
    while stack:
        y,x=stack[-1]; choices=[]
        for bit,dy,dx,opp in DIRS:
            ny,nx=y+dy,x+dx
            if 0<=ny<size and 0<=nx<size and (ny,nx) not in seen: choices.append((bit,ny,nx,opp))
        if not choices: stack.pop(); continue
        bit,ny,nx,opp=r.choice(choices); grid[y][x]|=bit; grid[ny][nx]|=opp; seen.add((ny,nx)); stack.append((ny,nx))
    solution=[row[:] for row in grid]
    for y in range(size):
      for x in range(size):
        for _ in range(r.randrange(4)): grid[y][x]=rotate(grid[y][x])
    return {"size":size,"grid":grid,"start":[0,0],"goal":[size-1,size-1],"solution":solution}
def reachable(grid, start, goal):
    n=len(grid); seen={tuple(start)}; todo=[tuple(start)]
    while todo:
        y,x=todo.pop()
        if [y,x]==goal: return True
        for bit,dy,dx,opp in DIRS:
            ny,nx=y+dy,x+dx
            if grid[y][x]&bit and 0<=ny<n and 0<=nx<n and grid[ny][nx]&opp and (ny,nx) not in seen:
                seen.add((ny,nx)); todo.append((ny,nx))
    return False
