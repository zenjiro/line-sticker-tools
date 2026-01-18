import streamlit as st
import zipfile
import io
from PIL import Image

st.set_page_config(page_title="LINE Sticker Creator", layout="wide")

def resize_image(image, size):
    """Resize image maintaining aspect ratio with padding"""
    img = image.copy()
    img.thumbnail(size, Image.Resampling.LANCZOS)
    
    new_img = Image.new('RGBA', size, (0, 0, 0, 0))
    x = (size[0] - img.size[0]) // 2
    y = (size[1] - img.size[1]) // 2
    new_img.paste(img, (x, y), img if img.mode == 'RGBA' else None)
    
    return new_img

def create_zip_package(stickers, main_img, tab_img, package_count):
    """Create ZIP package with proper naming"""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for i, sticker in enumerate(stickers[:package_count], 1):
            resized = resize_image(sticker, (370, 320))
            img_buffer = io.BytesIO()
            resized.save(img_buffer, format='PNG')
            zip_file.writestr(f"{i:02d}.png", img_buffer.getvalue())
        
        if main_img:
            main_resized = resize_image(main_img, (240, 240))
            main_buffer = io.BytesIO()
            main_resized.save(main_buffer, format='PNG')
            zip_file.writestr("main.png", main_buffer.getvalue())
        
        if tab_img:
            tab_resized = resize_image(tab_img, (96, 74))
            tab_buffer = io.BytesIO()
            tab_resized.save(tab_buffer, format='PNG')
            zip_file.writestr("tab.png", tab_buffer.getvalue())
    
    zip_buffer.seek(0)
    return zip_buffer

# Initialize session state
if 'stickers' not in st.session_state:
    st.session_state.stickers = []
if 'main_image' not in st.session_state:
    st.session_state.main_image = None
if 'tab_image' not in st.session_state:
    st.session_state.tab_image = None
if 'selection_mode' not in st.session_state:
    st.session_state.selection_mode = 'normal'
if 'selected_stickers' not in st.session_state:
    st.session_state.selected_stickers = set()

# Keyboard shortcuts handler
if 'key_pressed' not in st.session_state:
    st.session_state.key_pressed = None

st.title("LINE Sticker Package Creator")

# Keyboard shortcuts help
with st.expander("⌨️ キーボードショートカット"):
    st.write("**Delete キー**: 選択した画像を未選択にする")

# Sidebar controls
with st.sidebar:
    st.header("Package Settings")
    package_count = st.selectbox("Sticker Count", [8, 16, 24, 32, 40], index=0)
    
    st.header("Selection Mode")
    mode = st.radio("Mode", ["Normal", "Select Main Image", "Select Tab Image"], key="mode_radio")
    if mode == "Normal":
        st.session_state.selection_mode = 'normal'
    elif mode == "Select Main Image":
        st.session_state.selection_mode = 'main'
    else:
        st.session_state.selection_mode = 'tab'

# Main content
col1, col2 = st.columns([2, 1])

with col1:
    st.header("Sticker Images")
    
    uploaded_stickers = st.file_uploader(
        "Upload sticker images", 
        type=['png', 'jpg', 'jpeg'], 
        accept_multiple_files=True,
        key="sticker_upload"
    )
    
    if uploaded_stickers:
        for uploaded_file in uploaded_stickers:
            if len(st.session_state.stickers) < 40:
                img = Image.open(uploaded_file)
                st.session_state.stickers.append(img)
    
    if st.session_state.stickers:
        st.subheader(f"Current Stickers ({len(st.session_state.stickers)}/{package_count})")
        
        # Display stickers in grid with controls
        cols = st.columns(4)
        for i, sticker in enumerate(st.session_state.stickers):
            with cols[i % 4]:
                # Check if this sticker is selected
                is_selected = i in st.session_state.selected_stickers
                border_style = "border: 2px solid #ff4b4b;" if is_selected else ""
                
                # Display image with selection indicator
                st.markdown(f'<div style="{border_style} padding: 2px;">', unsafe_allow_html=True)
                st.image(sticker, caption=f"Sticker {i+1}", width=100)
                st.markdown('</div>', unsafe_allow_html=True)
                
                # Show different buttons based on selection mode
                if st.session_state.selection_mode == 'normal':
                    # Normal mode: show select/unselect and reorder buttons
                    button_cols = st.columns(3)
                    with button_cols[0]:
                        if is_selected:
                            if st.button("❌ 未選択", key=f"unselect_{i}", help="未選択にする"):
                                st.session_state.selected_stickers.discard(i)
                                st.rerun()
                        else:
                            if st.button("✅ 選択", key=f"select_{i}", help="選択する"):
                                st.session_state.selected_stickers.add(i)
                                st.rerun()
                    with button_cols[1]:
                        if i > 0 and st.button("↑", key=f"up_{i}", help="Move up"):
                            st.session_state.stickers[i], st.session_state.stickers[i-1] = st.session_state.stickers[i-1], st.session_state.stickers[i]
                            # Update selection indices
                            if i in st.session_state.selected_stickers:
                                st.session_state.selected_stickers.discard(i)
                                st.session_state.selected_stickers.add(i-1)
                            if i-1 in st.session_state.selected_stickers:
                                st.session_state.selected_stickers.discard(i-1)
                                st.session_state.selected_stickers.add(i)
                            st.rerun()
                    with button_cols[2]:
                        if i < len(st.session_state.stickers) - 1 and st.button("↓", key=f"down_{i}", help="Move down"):
                            st.session_state.stickers[i], st.session_state.stickers[i+1] = st.session_state.stickers[i+1], st.session_state.stickers[i]
                            # Update selection indices
                            if i in st.session_state.selected_stickers:
                                st.session_state.selected_stickers.discard(i)
                                st.session_state.selected_stickers.add(i+1)
                            if i+1 in st.session_state.selected_stickers:
                                st.session_state.selected_stickers.discard(i+1)
                                st.session_state.selected_stickers.add(i)
                            st.rerun()
                
                elif st.session_state.selection_mode == 'main':
                    # Main image selection mode
                    if st.button("Set as Main", key=f"main_{i}"):
                        st.session_state.main_image = sticker
                        st.session_state.selection_mode = 'normal'
                        st.rerun()
                
                elif st.session_state.selection_mode == 'tab':
                    # Tab image selection mode
                    if st.button("Set as Tab", key=f"tab_{i}"):
                        st.session_state.tab_image = sticker
                        st.session_state.selection_mode = 'normal'
                        st.rerun()

with col2:
    st.header("Main & Tab Images")
    
    # Main image
    st.subheader("Main Image (240x240px)")
    main_upload = st.file_uploader("Upload main image", type=['png', 'jpg', 'jpeg'], key="main_upload")
    if main_upload:
        st.session_state.main_image = Image.open(main_upload)
    
    if st.session_state.main_image:
        st.image(st.session_state.main_image, caption="Main Image", width=120)
        if st.button("Remove Main"):
            st.session_state.main_image = None
            st.rerun()
    
    # Tab image
    st.subheader("Tab Image (96x74px)")
    tab_upload = st.file_uploader("Upload tab image", type=['png', 'jpg', 'jpeg'], key="tab_upload")
    if tab_upload:
        st.session_state.tab_image = Image.open(tab_upload)
    
    if st.session_state.tab_image:
        st.image(st.session_state.tab_image, caption="Tab Image", width=96)
        if st.button("Remove Tab"):
            st.session_state.tab_image = None
            st.rerun()

# Action buttons
st.header("Actions")
col1, col2, col3 = st.columns(3)

# Handle Delete key for unselecting
if st.session_state.selected_stickers:
    st.markdown("""
    <script>
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Delete') {
            window.parent.postMessage({type: 'streamlit:setComponentValue', value: 'delete_pressed'}, '*');
        }
    });
    </script>
    """, unsafe_allow_html=True)
    
    # Check if delete was pressed (simulated via button for Streamlit compatibility)
    if st.button("🗑️ Delete キーで未選択", key="delete_key_sim", help="選択した画像を未選択にする"):
        st.session_state.selected_stickers.clear()
        st.rerun()

with col1:
    if st.button("Clear All", type="secondary"):
        st.session_state.stickers = []
        st.session_state.main_image = None
        st.session_state.tab_image = None
        st.session_state.selected_stickers.clear()
        st.rerun()

with col2:
    if st.session_state.selected_stickers:
        if st.button("❌ 全て未選択", type="secondary"):
            st.session_state.selected_stickers.clear()
            st.rerun()

with col3:
    can_create = (len(st.session_state.stickers) >= package_count and 
                  st.session_state.main_image and 
                  st.session_state.tab_image)
    
    if can_create:
        zip_data = create_zip_package(
            st.session_state.stickers,
            st.session_state.main_image,
            st.session_state.tab_image,
            package_count
        )
        
        st.download_button(
            label="Download ZIP Package",
            data=zip_data,
            file_name=f"line_stickers_{package_count}.zip",
            mime="application/zip",
            type="primary"
        )
    else:
        st.button("Download ZIP Package", disabled=True, type="primary")

# Status display
st.header("Package Status")
status_col1, status_col2, status_col3 = st.columns(3)

with status_col1:
    sticker_status = "✅" if len(st.session_state.stickers) >= package_count else "❌"
    st.metric("Stickers", f"{len(st.session_state.stickers)}/{package_count}")
    st.write(f"{sticker_status} Stickers ready")

with status_col2:
    main_status = "✅" if st.session_state.main_image else "❌"
    st.write(f"{main_status} Main image")

with status_col3:
    tab_status = "✅" if st.session_state.tab_image else "❌"
    st.write(f"{tab_status} Tab image")