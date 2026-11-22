"""Generates original SVG-painted game background and transparent PNG sprite assets.
No external paid assets. Run: python tools/generate_assets.py
"""
from pathlib import Path
import cairosvg
import random
random.seed(43)
ROOT=Path(__file__).resolve().parents[1]/'public'/'assets'
(ROOT/'rooms').mkdir(parents=True,exist_ok=True)
(ROOT/'objects').mkdir(parents=True,exist_ok=True)
(ROOT/'hero').mkdir(parents=True,exist_ok=True)

def to_png(svg,path,sz=None):
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True)
    args={'bytestring':svg.encode(),'write_to':str(p)}
    if sz: args.update(output_width=sz[0],output_height=sz[1])
    cairosvg.svg2png(**args)

def S(vb,body,defs='',width=None,height=None):
    w,h=vb
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width or w}" height="{height or h}" viewBox="0 0 {w} {h}">
<defs><linearGradient id="wall" x2="0" y2="1"><stop stop-color="#25354e"/><stop offset=".5" stop-color="#34415e"/><stop offset="1" stop-color="#6b536c"/></linearGradient>
<linearGradient id="wood" x2="0" y2="1"><stop stop-color="#9a6956"/><stop offset="1" stop-color="#3d3044"/></linearGradient>
<linearGradient id="window" x2=".5" y2="1"><stop stop-color="#3e6893"/><stop offset="1" stop-color="#edab8a"/></linearGradient>
<linearGradient id="floor" x2="0" y2="1"><stop stop-color="#825e64"/><stop offset="1" stop-color="#392d42"/></linearGradient>
<linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fff0b7"/><stop offset="1" stop-color="#d0a260"/></linearGradient>
<radialGradient id="light"><stop stop-color="#ffe6aa" stop-opacity=".26"/><stop offset="1" stop-color="#ffe6aa" stop-opacity="0"/></radialGradient>
<pattern id="wallpaper" width="110" height="140" patternUnits="userSpaceOnUse"><path d="M55 0 Q9 41 55 77 Q101 41 55 0 M55 77 Q14 103 55 140 Q96 103 55 77" fill="none" stroke="#f3c4ae" opacity=".08" stroke-width="1.7"/><circle cx="55" cy="77" r="3" fill="#f3c4ae" opacity=".14"/></pattern>
<filter id="shadow"><feGaussianBlur stdDeviation="17"/></filter>
{defs}</defs>{body}</svg>'''

stars=''.join(f'<circle cx="{random.randint(110,1120)}" cy="{random.randint(44,246)}" r="{random.choice([1,1.5,2])}" fill="#fbf2d5" opacity="{random.uniform(.25,.8):.2f}"/>' for _ in range(36))

def room_base(name):
    themes={'bedroom':('#273450','#6c566a','#56405e'),'kitchen':('#365164','#6a746d','#50625e'),'living':('#38455f','#6e6578','#534664')}
    c1,c2,c3=themes[name]
    return f'''<rect width="1280" height="720" fill="{c1}"/><path d="M0 0 H1280 V605 H0Z" fill="{c2}" opacity=".42"/>
<rect width="1280" height="605" fill="url(#wallpaper)"/><path d="M0 0 V605 H1280" fill="none" stroke="#bca69c" stroke-opacity=".33" stroke-width="13"/>
<path d="M0 445 H1280 M0 600 H1280" stroke="#e1bca9" stroke-width="9" opacity=".3"/>
<rect y="603" width="1280" height="117" fill="url(#floor)"/>
{''.join(f'<path d="M0 {610+i*19} H1280" stroke="#231e32" stroke-width="2" opacity=".26"/>' for i in range(7))}
{''.join(f'<path d="M{x} 605 v118" stroke="#211d32" stroke-width="3" opacity=".23"/>' for x in range(90,1300,158))}
<rect x="0" y="602" width="1280" height="9" fill="#d9a58c" opacity=".65"/>
<ellipse cx="640" cy="625" rx="620" ry="58" fill="#f2ad82" opacity=".07"/>
'''

# shared window, floating dust, upper lights
window=f'''<rect x="450" y="96" width="325" height="312" rx="14" fill="#1f263d" stroke="#b89186" stroke-width="18"/>
<rect x="468" y="113" width="288" height="274" rx="5" fill="url(#window)"/>
<path d="M465 250 H759 M609 112 V390" stroke="#d8b2a7" stroke-width="12"/>
<circle cx="691" cy="181" r="45" fill="#ffeac1" opacity=".74"/>{stars}
<path d="M470 358 Q542 300 601 355 Q679 312 758 348 V387 H470Z" fill="#293952" opacity=".75"/>
<path d="M451 91 Q498 154 475 282 Q451 322 447 393 L416 406 Q423 164 401 90Z" fill="#8a6074" stroke="#d5a6a0" stroke-width="5"/>
<path d="M775 91 Q731 162 751 280 Q777 347 784 395 L811 408 Q802 164 827 91Z" fill="#8a6074" stroke="#d5a6a0" stroke-width="5"/>
<rect x="422" y="390" width="389" height="15" rx="5" fill="#bc9b8f"/>
'''

bedroom=room_base('bedroom')+window+'''
<ellipse cx="300" cy="626" rx="320" ry="30" fill="#170d22" opacity=".38"/>
<path d="M38 415 Q31 398 42 391 L68 388 L70 595 H42Z" fill="#a86b6b" stroke="#d4a18e" stroke-width="7"/>
<rect x="69" y="450" width="352" height="150" rx="27" fill="#6f587e" stroke="#cda6aa" stroke-width="10"/>
<path d="M70 468 Q184 423 417 467 L413 553 Q257 587 72 550Z" fill="#b98da8"/>
<path d="M70 523 Q207 570 412 529 V585 Q235 621 73 583Z" fill="#6d819e" stroke="#a1adc1" stroke-width="6"/>
<rect x="87" y="431" width="115" height="40" rx="18" fill="#e1c4b5" stroke="#fbddbd" stroke-width="5"/>
<path d="M105 585 Q280 612 407 581" stroke="#dac0bb" stroke-width="4" opacity=".45" fill="none"/>
<ellipse cx="935" cy="621" rx="150" ry="19" fill="#1c152d" opacity=".3"/>
<path d="M846 425 V596 M1030 423 V596" stroke="#a98283" stroke-width="14" stroke-linecap="round"/>
<rect x="817" y="424" width="238" height="18" rx="8" fill="#b88979"/>
<rect x="903" y="445" width="114" height="80" rx="9" fill="#5b475b" stroke="#a98283" stroke-width="5"/>
<path d="M900 458 h115" stroke="#d8ac96" stroke-opacity=".35"/>
<path d="M1018 523 v75" stroke="#a98283" stroke-width="11"/>
<path d="M1121 183 h127 v420 h-127 Z" fill="#483a53" stroke="#b78982" stroke-width="13"/>
<path d="M1182 195 v391" stroke="#c79e90" stroke-width="6"/><circle cx="1167" cy="400" r="5" fill="#f5cc89"/><circle cx="1199" cy="400" r="5" fill="#f5cc89"/>
<ellipse cx="205" cy="665" rx="220" ry="37" fill="#ae8d9f" opacity=".3"/>
<rect x="0" y="0" width="1280" height="720" fill="url(#light)" opacity=".3"/>
'''

kitchen=room_base('kitchen')+'''
<rect x="419" y="106" width="344" height="260" rx="15" fill="#1e3443" stroke="#c9b49c" stroke-width="18"/>
<rect x="437" y="124" width="307" height="225" fill="url(#window)"/>
<path d="M591 115 V353 M429 238 H750" stroke="#cbb7a9" stroke-width="11"/>
<circle cx="668" cy="185" r="33" fill="#ffe3b6" opacity=".64"/>
<path d="M435 323 Q527 258 605 320 Q687 287 747 311 V351 H435Z" fill="#3e6563"/>
<path d="M43 385 H427 V595 H43Z" fill="#65847c" stroke="#a7b49c" stroke-width="10"/>
<path d="M35 374 H435 v22 H35Z" fill="#d9b8a0" stroke="#edd8b8" stroke-width="4"/>
<path d="M70 417 H204 V566 H70Z M225 417 H401 V566 H225Z" fill="#526c72" stroke="#adbbb0" stroke-width="5"/>
<circle cx="188" cy="481" r="5" fill="#f4d4a2"/><circle cx="246" cy="481" r="5" fill="#f4d4a2"/>
<path d="M847 375 H1187 V597 H847Z" fill="#628078" stroke="#b3bdaa" stroke-width="10"/>
<path d="M828 362 H1210 v22 H828Z" fill="#dbc3a7" stroke="#e9ddc9" stroke-width="4"/>
<path d="M862 412 H1160 V571 H862Z" stroke="#b8c6b4" stroke-width="5" fill="none"/>
<path d="M1021 395 V577" stroke="#bdc4ac" stroke-width="5"/><circle cx="1000" cy="479" r="5" fill="#fae4c0"/><circle cx="1042" cy="479" r="5" fill="#fae4c0"/>
<rect x="875" y="97" width="256" height="193" rx="16" fill="#6d8f82" stroke="#b6c1aa" stroke-width="10"/>
<path d="M990 108 V280" stroke="#c0cbb7" stroke-width="5"/><circle cx="981" cy="198" r="5" fill="#f9d7ac"/><circle cx="1003" cy="198" r="5" fill="#f9d7ac"/>
<ellipse cx="633" cy="641" rx="257" ry="33" fill="#c8a8a1" opacity=".28"/>
'''

living=room_base('living')+'''
<rect x="78" y="138" width="288" height="266" rx="13" fill="#1e2b45" stroke="#bea6aa" stroke-width="17"/>
<rect x="96" y="155" width="252" height="233" fill="url(#window)"/>
<path d="M215 151 V391" stroke="#c7a4a9" stroke-width="12"/><circle cx="289" cy="219" r="40" fill="#f6dbac" opacity=".7"/>
<path d="M87 129 Q140 245 86 397 L55 415 Q71 210 43 128Z" fill="#92687f" stroke="#d3a7aa" stroke-width="6"/>
<path d="M356 129 Q314 250 354 391 L391 415 Q386 210 407 128Z" fill="#92687f" stroke="#d3a7aa" stroke-width="6"/>
<path d="M495 456 Q493 415 541 412 H886 Q933 413 935 451 V565 H495Z" fill="#6b7293" stroke="#9aabc4" stroke-width="11"/>
<rect x="522" y="425" width="182" height="93" rx="29" fill="#8791b0" stroke="#9ba8c6" stroke-width="6"/>
<rect x="716" y="425" width="197" height="93" rx="29" fill="#8791b0" stroke="#9ba8c6" stroke-width="6"/>
<rect x="477" y="479" width="71" height="115" rx="22" fill="#64708c" stroke="#a5abc4" stroke-width="8"/>
<rect x="884" y="479" width="69" height="115" rx="22" fill="#64708c" stroke="#a5abc4" stroke-width="8"/>
<ellipse cx="710" cy="611" rx="260" ry="24" fill="#1a1c33" opacity=".36"/>
<path d="M1012 202 h230 v170 h-230Z" fill="#192941" stroke="#9c9baa" stroke-width="13"/>
<path d="M1028 219 h199 v139 h-199Z" fill="#38546d"/>
<path d="M1056 336 Q1106 255 1163 315 T1228 314 V358 H1029Z" fill="#6b89a0"/>
<path d="M1126 377 V410" stroke="#a5a0b2" stroke-width="11"/><path d="M1076 411 H1175" stroke="#ac9eb4" stroke-width="11"/>
<path d="M1002 438 h251 v170 h-251Z" fill="#5b4c65" stroke="#a18a94" stroke-width="9"/>
<path d="M1018 471 H1235 M1018 539 H1235" stroke="#c39c99" stroke-width="4"/>
<ellipse cx="581" cy="642" rx="370" ry="40" fill="#9c91a2" opacity=".24"/>
'''

for name,body in [('bedroom',bedroom),('kitchen',kitchen),('living',living)]:
    to_png(S((1280,720),body),f'rooms/{name}.png')

# All handheld items are transparent pixel sprites; Phaser uses the same original assets in every room.
def item_svg(kind):
    outline='#473d54'; hi='#f3dbc1'; h=''
    if kind=='lamp':
        h='''<ellipse cx="100" cy="180" rx="49" ry="10" fill="#1c182d" opacity=".23"/><path d="M100 83 V158" stroke="#b69a86" stroke-width="13"/><ellipse cx="100" cy="159" rx="47" ry="12" fill="#98788a" stroke="#41364d" stroke-width="7"/><path d="M59 84 Q100 -11 141 84Z" fill="#e7bd98" stroke="#fff0c5" stroke-width="6"/><path d="M75 82 H125" stroke="#805b70" stroke-width="4"/>'''
    elif kind=='book':
        h='''<g transform="rotate(-12 101 105)"><rect x="46" y="62" width="112" height="86" rx="9" fill="#d9a36b" stroke="#604660" stroke-width="9"/><path d="M57 67 H148 V139 H57Z" fill="#647b8c" stroke="#e8c2a8" stroke-width="4"/><path d="M65 94 H139 M67 110 H138" stroke="#f8d0a1" stroke-width="4"/><path d="M105 65 V139" stroke="#d3a59d" stroke-width="3"/></g>'''
    elif kind=='backpack':
        h='''<path d="M67 68 V52 Q99 23 133 54 V72" fill="none" stroke="#75576b" stroke-width="15"/><rect x="49" y="64" width="103" height="114" rx="32" fill="#997f9d" stroke="#4d415d" stroke-width="10"/><rect x="63" y="112" width="74" height="50" rx="15" fill="#c19bb1" stroke="#66516a" stroke-width="7"/><rect x="89" y="110" width="22" height="19" rx="6" fill="#f2d59f"/>'''
    elif kind=='jacket':
        h='''<path d="M75 34 L51 59 L24 94 L42 124 L62 105 V175 H139 V105 L159 124 L178 93 L148 57 L126 34Z" fill="#a46e75" stroke="#4c4158" stroke-width="9"/><path d="M76 35 L100 65 L124 35 M100 65 V173" stroke="#e2b19f" stroke-width="7" fill="none"/><circle cx="113" cy="102" r="4" fill="#ffe2a6"/><circle cx="113" cy="126" r="4" fill="#ffe2a6"/>'''
    elif kind=='shoes':
        h='''<path d="M29 95 Q63 96 73 129 L90 139 Q102 156 94 165 H28 Q13 153 23 140Z" fill="#bd8a73" stroke="#514258" stroke-width="8"/><path d="M108 93 Q144 95 154 128 L175 141 Q184 159 173 166 H105 Q91 150 105 139Z" fill="#c9a28a" stroke="#514258" stroke-width="8"/><path d="M35 148 H84 M113 149 H163" stroke="#f5d8b4" stroke-width="5"/>'''
    elif kind=='phone':
        h='''<g transform="rotate(14 100 100)"><rect x="71" y="31" width="59" height="138" rx="13" fill="#363d58" stroke="#bea0a0" stroke-width="8"/><rect x="80" y="50" width="40" height="96" rx="5" fill="#84a7bb"/><circle cx="100" cy="158" r="5" fill="#dcc7b8"/><path d="M91 40 H110" stroke="#d0c1ad" stroke-width="3"/></g>'''
    elif kind=='pillow':
        h='''<path d="M39 73 Q35 45 70 52 Q104 37 142 50 Q167 43 166 78 L168 127 Q154 146 127 139 Q96 157 64 138 Q34 145 35 118Z" fill="#eac5b7" stroke="#8c788e" stroke-width="8"/><path d="M53 80 Q67 60 88 67" fill="none" stroke="#fbe6cc" stroke-width="5"/>'''
    elif kind=='cup':
        h='''<path d="M50 72 H136 V133 Q132 158 98 160 Q59 159 54 135Z" fill="#e8c3a9" stroke="#6a5b73" stroke-width="8"/><path d="M137 85 Q178 74 165 114 Q152 140 135 128" fill="none" stroke="#cfae9f" stroke-width="12"/><ellipse cx="94" cy="72" rx="43" ry="12" fill="#765c61" stroke="#dfc3b2" stroke-width="6"/>'''
    elif kind=='apple':
        h='''<path d="M101 67 Q65 36 48 76 Q26 139 78 166 Q98 173 110 163 Q158 176 164 119 Q171 60 128 64 Q113 61 101 67" fill="#d88472" stroke="#7e515d" stroke-width="8"/><path d="M103 69 Q97 49 105 28" stroke="#675951" stroke-width="8"/><path d="M102 48 Q136 15 144 45 Q128 61 102 48Z" fill="#7e9f7d" stroke="#4b655f" stroke-width="5"/>'''
    elif kind=='kettle':
        h='''<path d="M49 84 Q37 54 69 49 H133 Q159 54 151 91 V148 H50Z" fill="#9bb2af" stroke="#566875" stroke-width="8"/><path d="M136 49 Q185 61 176 110 Q169 135 151 126" stroke="#5b6470" stroke-width="13" fill="none"/><path d="M49 64 L25 61 L18 82 L46 87" fill="#cdb7a5" stroke="#566875" stroke-width="6"/><path d="M90 48 V27 H120 V49" fill="#6a7280" stroke="#d9c3b7" stroke-width="6"/>'''
    elif kind=='plate':
        h='''<ellipse cx="99" cy="113" rx="81" ry="40" fill="#e5d6ba" stroke="#a6b6b4" stroke-width="10"/><ellipse cx="99" cy="113" rx="57" ry="27" fill="#f5e9d2" stroke="#c8c8bc" stroke-width="5"/>'''
    elif kind=='spoon':
        h='''<g transform="rotate(35 100 105)"><ellipse cx="99" cy="63" rx="28" ry="37" fill="#b9c8c9" stroke="#5a6870" stroke-width="7"/><rect x="90" y="95" width="18" height="95" rx="8" fill="#d6cfc1" stroke="#697782" stroke-width="5"/></g>'''
    elif kind=='towel':
        h='''<path d="M48 36 H149 V173 H48Z" fill="#96b6bd" stroke="#5b7983" stroke-width="7"/><path d="M59 66 H139 M59 135 H139" stroke="#cce4e0" stroke-width="5"/><path d="M72 40 V170" stroke="#71949d" stroke-width="3"/>'''
    elif kind=='remote':
        h='''<g transform="rotate(-13 99 100)"><rect x="73" y="29" width="52" height="155" rx="16" fill="#3e4560" stroke="#a2a0a9" stroke-width="6"/><circle cx="100" cy="54" r="9" fill="#d48d8b"/><circle cx="87" cy="85" r="6" fill="#d8c4b4"/><circle cx="111" cy="85" r="6" fill="#d8c4b4"/><rect x="86" y="109" width="28" height="12" rx="6" fill="#8995ae"/><rect x="86" y="134" width="28" height="12" rx="6" fill="#8995ae"/></g>'''
    elif kind=='plant':
        h='''<path d="M72 110 L62 167 H137 L127 110Z" fill="#aa806e" stroke="#59485a" stroke-width="8"/><path d="M100 115 L100 48" stroke="#6b8e6f" stroke-width="10"/><path d="M99 91 Q38 72 46 42 Q90 37 99 91 M104 72 Q155 28 165 63 Q130 102 104 72 M100 109 Q55 117 58 82 Q90 80 100 109 M103 60 Q76 9 117 21 Q131 48 103 60" fill="#83a98c" stroke="#456e68" stroke-width="6"/>'''
    elif kind=='keys':
        h='''<circle cx="70" cy="85" r="26" fill="none" stroke="#dfc29e" stroke-width="12"/><path d="M92 99 L155 158 M125 129 L143 109 M140 145 L160 125" stroke="#d3b48c" stroke-width="13" stroke-linecap="round"/>'''
    elif kind=='trash':
        h='''<path d="M55 69 L66 172 H135 L148 69Z" fill="#81948e" stroke="#52626d" stroke-width="8"/><rect x="43" y="55" width="115" height="17" rx="6" fill="#93a9a0" stroke="#596774" stroke-width="6"/><path d="M81 83 L87 154 M118 83 L113 154" stroke="#c2d1bd" stroke-width="7"/>'''
    elif kind=='picture':
        h='''<rect x="35" y="26" width="130" height="148" rx="6" fill="#9d7884" stroke="#e1bdab" stroke-width="13"/><rect x="49" y="41" width="103" height="118" fill="#7c9ba0"/><path d="M49 139 Q78 75 105 109 Q135 68 152 101 V159 H49Z" fill="#506b74"/><circle cx="118" cy="76" r="17" fill="#f6d6a4"/>'''
    elif kind=='ball':
        h='''<circle cx="100" cy="108" r="68" fill="#b3a1bf" stroke="#5e586f" stroke-width="9"/><path d="M47 70 Q86 98 84 171 M146 65 Q116 97 122 170 M34 112 Q100 84 167 116" stroke="#e4c6c4" fill="none" stroke-width="7"/>'''
    else:
        h='''<circle cx="100" cy="105" r="45" fill="#b69a9d" stroke="#6d576b" stroke-width="8"/>'''
    return S((200,200),h)
for k in ['lamp','book','backpack','jacket','shoes','phone','pillow','cup','apple','kettle','plate','spoon','towel','remote','plant','keys','trash','picture','ball']:
    to_png(item_svg(k),f'objects/{k}.png',sz=(180,180))

# Hero original character SVG frames, with reusable pieces and stable anchors
# feet at y=192 of a 200-high sprite; right-facing. Frames can be flipped.
def hero_pose(pose):
    x=100; y=0
    head='''<ellipse cx="103" cy="54" rx="28" ry="32" fill="#e9b69a" stroke="#5e4a5f" stroke-width="5"/>
<path d="M76 55 Q68 22 98 19 Q123 12 136 37 L131 50 Q119 30 110 35 L94 32 Q87 50 76 55Z" fill="#463e58" stroke="#312e47" stroke-width="4"/>
<circle cx="116" cy="55" r="3.5" fill="#332f42"/><path d="M114 71 Q122 74 127 67" stroke="#ad6879" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="75" cy="61" rx="6" ry="10" fill="#e7af97"/>
<path d="M72 48 Q82 25 98 21" fill="none" stroke="#63516a" stroke-width="5"/>'''
    torso='''<path d="M84 86 Q101 93 120 84 L133 139 Q105 154 78 139Z" fill="#e3a16d" stroke="#5a4961" stroke-width="6"/>
<path d="M82 105 Q106 119 130 102" stroke="#f2c08a" stroke-width="5" fill="none"/>
<path d="M101 91 L107 120" stroke="#9d6972" stroke-width="4"/>'''
    if pose in ['crouch','reach','grab']:
        legs='''<path d="M85 140 Q66 150 63 173 L89 180 L106 157 Q125 182 148 179" fill="none" stroke="#394d63" stroke-width="17" stroke-linecap="round"/><path d="M59 181 H90 M134 181 H160" stroke="#3e384d" stroke-width="11" stroke-linecap="round"/>'''
        arms='''<path d="M85 103 L73 132 L86 145 M124 102 L145 128 L161 138" fill="none" stroke="#e2b197" stroke-width="12" stroke-linecap="round"/>'''
        if pose=='reach': arms='''<path d="M84 102 L67 132 L89 143 M122 101 L154 132 L173 136" fill="none" stroke="#e2b197" stroke-width="12" stroke-linecap="round"/>'''
    elif pose=='sit':
        legs='''<path d="M82 143 L104 154 L130 155 L156 174 M95 148 L108 169 L90 177" fill="none" stroke="#394d63" stroke-width="16" stroke-linecap="round"/><path d="M139 179 H162 M76 180 H99" stroke="#3f394d" stroke-width="12" stroke-linecap="round"/>'''
        arms='''<path d="M84 103 L73 135 L95 144 M124 103 L135 134 L119 142" fill="none" stroke="#e2b197" stroke-width="13" stroke-linecap="round"/>'''
    else:
        if pose=='walk1':
            legs='''<path d="M90 138 L73 165 L59 187 M118 137 L133 162 L146 184" stroke="#394d63" stroke-width="17" fill="none" stroke-linecap="round"/><path d="M48 188 H71 M140 187 H159" stroke="#403a4d" stroke-width="12" stroke-linecap="round"/>'''
            arms='''<path d="M83 104 L70 128 L84 143 M125 103 L144 123 L130 138" stroke="#e4b397" stroke-width="12" fill="none" stroke-linecap="round"/>'''
        elif pose=='walk2':
            legs='''<path d="M90 138 L104 166 L117 187 M118 137 L98 161 L84 186" stroke="#394d63" stroke-width="17" fill="none" stroke-linecap="round"/><path d="M108 188 H133 M71 188 H93" stroke="#403a4d" stroke-width="12" stroke-linecap="round"/>'''
            arms='''<path d="M83 104 L102 125 L87 140 M124 103 L110 126 L130 137" stroke="#e4b397" stroke-width="12" fill="none" stroke-linecap="round"/>'''
        elif pose in ['use','hold']:
            legs='''<path d="M89 138 L85 186 M117 138 L124 186" fill="none" stroke="#394d63" stroke-width="17" stroke-linecap="round"/><path d="M71 188 H100 M111 188 H141" stroke="#403a4d" stroke-width="12" stroke-linecap="round"/>'''
            arms='''<path d="M82 104 L77 124 L109 132 M124 103 L144 118 L156 110" fill="none" stroke="#e4b397" stroke-width="12" stroke-linecap="round"/>'''
        else:
            legs='''<path d="M90 139 L87 187 M117 139 L121 187" fill="none" stroke="#394d63" stroke-width="17" stroke-linecap="round"/><path d="M74 190 H100 M110 190 H139" stroke="#403a4d" stroke-width="12" stroke-linecap="round"/>'''
            arms='''<path d="M83 104 L76 133 L84 145 M124 105 L137 132 L128 145" fill="none" stroke="#e4b397" stroke-width="12" stroke-linecap="round"/>'''
    return S((200,200),f'''<ellipse cx="105" cy="193" rx="42" ry="6" fill="#15182a" opacity=".25"/>{legs}{torso}{arms}{head}''')
for pose in ['idle','walk1','walk2','crouch','reach','grab','sit','hold','use']:
    to_png(hero_pose(pose),f'hero/{pose}.png',sz=(300,300))
print('Created original background and sprite assets:',len(list(ROOT.rglob('*.png'))))
